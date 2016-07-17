define(['jquery', 'd3', 'd3-hierarchy', 'd3-drag', 'd3-dispatch', 'd3-selection'], function ($, d3, d3hierarchy, d3drag, d3dispatch, d3selection) {
    'use strict';
    d3.hierarchy.prototype.descendantsBefore = function () {
        var nodes = [];
        this.eachBefore(function(node) {
          nodes.push(node);
        });
        return nodes;
    };

    var SvgTree = function () {
        this.settings = {
            showCheckboxes: false,
            showIcons: false,
            nodeHeight: 20,
            indentWidth: 16,
            duration: 400,
            dataUrl: 'tree-configuration.json',
            validation: {
                maxItems: Number.MAX_VALUE
            },
            unselectableElements: [],
            expandUpToLevel: Number.MAX_VALUE
        };

        this.viewportHeight = 0;
        this.scrollTop = 0;
        this.scrollHeight = 0;
        this.scrollBottom = 0;
        this.svg = null;
        this.iconElements = null;
        this.container = null;
        this.linkElements = null;
        this.nodeElements = null;
        /**
         * @type {Node}
         */
        this.rootNode = null;
        this.data = {};
        this.visibleRows = 0;
        this.position = 0;
        this.visibleNodesCount = 0;
        this.dispatch = null;
        this.selector = null;
    };

    SvgTree.prototype = {
        constructor: SvgTree,

        initialize: function (selector, settings) {
            $.extend(this.settings, settings);
            var me = this;
            this.selector = selector;
            this.dispatch = d3.dispatch('updateNodes', 'updateSvg', 'loadDataAfter', 'prepareLoadedNode', 'nodeSelectedAfter');
            this.svg = d3
                .select(selector)
                .append('svg')
                .attr('version', '1.1')
                .attr('width', '100%');
            this.container = this.svg
                .append('g')
                .attr('transform', 'translate(' + (this.settings.indentWidth / 2) + ',' + (this.settings.nodeHeight / 2) + ')');
            this.linkElements = this.container.append('g')
                .attr('class', 'links');
            this.nodeElements = this.container.append('g')
                .attr('class', 'nodes');
            if (this.settings.showIcons) {
                this.iconElements = this.svg.append('defs');
            }


            this.updateScrollPosition();
            this.loadData();

            $(window).on('resize scroll', function () {
                me.updateScrollPosition();
                me.update();
            });
        },

        updateScrollPosition: function () {

            var bodyRect = document.body.getBoundingClientRect(),
                elemRect = document.querySelector(this.selector).getBoundingClientRect(),
                offset   = elemRect.top - bodyRect.top;

            this.viewportHeight = parseInt(window.innerHeight);
            this.scrollTop = Math.max(0, (window.pageYOffset - offset) - (this.viewportHeight / 2));
            this.scrollHeight = parseInt(window.document.body.clientHeight);
            this.scrollBottom = this.scrollTop + this.viewportHeight + (this.viewportHeight / 2);
            this.viewportHeight = this.viewportHeight * 1.5;
        },

        loadData: function () {
            var me = this;
            d3.json(this.settings.dataUrl, function (error, json) {
                if (error) throw error;
                if (Array.isArray(json)) {
                    //little hack, so we can use json structure prepared by ExtJsJsonTreeRenderer
                    json = json[0];
                }

                var rootNode = d3.hierarchy(json);
                d3.tree(rootNode);

                rootNode.each(function (n) {
                    n.open = n.depth < me.settings.expandUpToLevel;
                    n.hasChildren = (n.children || n._children) ? 1 : 0;
                    n.parents = [];
                    n._isDragged = false;
                    if (n.parent) {
                        var x = n;
                        while (x && x.parent) {
                            if (x.parent.data.identifier) {
                                n.parents.push(x.parent.data.identifier);
                            }
                            x = x.parent;
                        }
                    }
                    if (typeof n.data.checked == 'undefined') {
                        n.data.checked = false;
                        me.settings.unselectableElements.push(n.data.identifier);
                    }
                    //dispatch event
                    me.dispatch.call('prepareLoadedNode', me, n);
                });
                me.rootNode = rootNode;
                me.dispatch.call('loadDataAfter', me);
                me.prepareDataForVisibleNodes();
                me.update();
            });
        },

        prepareDataForVisibleNodes: function () {
            var me = this;

            var blacklist = {};
            this.rootNode.eachBefore(function (node) {
                if (!node.open) {
                    blacklist[node.data.identifier] = true;
                }

            });

            this.data.nodes = this.rootNode.descendantsBefore().filter(function (node) {
                return node.hidden != true && !node.parents.some(function (id) {
                        return Boolean(blacklist[id]);
                    });
            });

            var iconHashes = [];
            this.data.links = [];
            this.data.icons = [];
            this.data.nodes.forEach(function (n, i) {
                //delete n.children;
                n.x = n.depth * me.settings.indentWidth;
                n.y = i * me.settings.nodeHeight;
                if (n.parent) {
                    me.data.links.push({
                        source: n.parent,
                        target: n
                    });
                }
                if (!n.iconHash && me.settings.showIcons && n.data.icon) {
                    n.iconHash = Math.abs(me.hashCode(n.data.icon));
                    if (iconHashes.indexOf(n.iconHash) === -1) {
                        iconHashes.push(n.iconHash);
                        me.data.icons.push({
                            identifier: n.iconHash,
                            icon: n.data.icon
                        });
                    }
                    delete n.data.icon;
                }
            });
            this.svg.attr('height', this.data.nodes.length * this.settings.nodeHeight);
        },

        update: function () {
            var me = this;
            var visibleRows = Math.ceil(this.viewportHeight / this.settings.nodeHeight + 1);
            var position = Math.floor(Math.max(this.scrollTop, 0) / this.settings.nodeHeight);
            var visibleNodes = this.data.nodes.slice(position, position + visibleRows);
            var nodes = this.nodeElements.selectAll('.node').data(visibleNodes, function (d) {
                return d.data.identifier;
            });

            // delete nodes without corresponding data
            nodes
                .exit()
                .remove();

            // if (this.visibleRows !== visibleRows || this.position !== position || this.visibleNodesCount !== visibleNodes.length) {
                this.visibleRows = visibleRows;
                this.position = position;
                this.visibleNodesCount = visibleNodes.length;
                nodes = this.updateSVGElements(nodes);
            // }
            // update
            nodes
                .attr('transform', this.xy)
                .select('text')
                .text(this.updateTextNode.bind(me));
            nodes
                .select('.toggle')
                .attr('transform', this.updateToggleTransform)
                .attr('visibility', this.updateToggleVisibility);

            if (this.settings.showIcons) {
                nodes
                    .select('use')
                    .attr('xlink:href', this.updateIconId);
            }

            //dispatch event
            this.dispatch.call('updateNodes', me, nodes);
        },
        updateLinks: function (nodes) {
            var me = this;
            var visibleLinks = this.data.links.filter(function (linkData) {
                return linkData.source.y <= me.scrollBottom && me.scrollTop <= linkData.target.y;
            });

            var links = this.linkElements
                .selectAll('.link')
                .data(visibleLinks);
            // delete
            links
                .exit()
                .remove();

            //create
            links.enter().append('path')
                .attr('class', 'link')
                //create + update
              .merge(links)
                .attr('d', this.squaredDiagonal.bind(me));
        },


        updateSVGElements: function (nodes) {
            var me = this;
            me.textPosition = 10;

            if (me.settings.showIcons) {
                var icons = this.iconElements
                    .selectAll('.icon-def')
                    .data(this.data.icons, function (i) {
                        return i.identifier;
                    });
                icons
                    .enter()
                    .append('g')
                    .attr('class', 'icon-def')
                    .attr('id', function (i) {
                        return 'icon-' + i.identifier;
                    })
                    .append(function (i) {
                        //workaround for IE11 where you can't simply call .html(content) on svg
                        var parser = new DOMParser();
                        var markupText = i.icon.replace('<svg', '<g').replace('/svg>', '/g>');
                        markupText = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'>" + markupText + "</svg>";
                        var dom = parser.parseFromString(markupText, "image/svg+xml");
                        return dom.documentElement.firstChild;
                    });
            }
            this.updateLinks();

            // create the node elements
            var nodeEnter = nodes
                .enter()
                .append('g')
                .attr('class', 'node')
                .attr('transform', this.xy);

            // append the chevron element
            var chevron = nodeEnter
                .append('g')
                .attr('class', 'toggle')
                .on('click', this.chevronClick.bind(me));

            // improve usability by making the click area a 16px square
            chevron
                .append('path')
                .style('opacity', 0)
                .attr('d', 'M 0 0 L 16 0 L 16 16 L 0 16 Z');
            chevron
                .append('path')
                .attr('class', 'chevron')
                .attr('d', 'M 4 3 L 13 8 L 4 13 Z');

            // append the icon element
            if (this.settings.showIcons) {
                me.textPosition = 30;
                nodeEnter
                    .append('use')
                    .attr('x', 8)
                    .attr('y', -8)
                    .on('click', me.clickOnIcon);
            }

            this.dispatch.call('updateSvg', me, nodeEnter);

            // append the text element
            nodeEnter
                .append('text')
                .attr('dx', me.textPosition)
                .attr('dy', 5)
                .on('click', function (node) {
                    me.clickOnLabel(node);
                })
                .on('dblclick', me.dblClickOnLabel);

            return nodes.merge(nodeEnter);
        },

        updateTextNode: function (node) {
            return node.data.name;
        },

        updateToggleTransform: function (node) {
            return node.open ? 'translate(8 -8) rotate(90)' : 'translate(-8 -8) rotate(0)';
        },

        updateToggleVisibility: function (node) {
            return node.hasChildren ? 'visible' : 'hidden';
        },

        updateIconId: function (node) {
            return '#icon-' + node.iconHash;
        },

        squaredDiagonal: function (link) {
            var me = this;

            var target = {
                x: link.target._isDragged ? link.target._x : link.target.x,
                y: link.target._isDragged ? link.target._y : link.target.y
            };
            var path = [];
            path.push('M' + link.source.x + ' ' + link.source.y);
            path.push('V' + target.y);
            if (target.hasChildren) {
                path.push('H' + target.x);
            } else {
                path.push('H' + (target.x + me.settings.indentWidth / 4));
            }
            return path.join(' ');
        },

        /**
         * @param {Node} node
         */
        xy: function (node) {
            return 'translate(' + node.x + ',' + node.y + ')';
        },

        hashCode: function (s) {
            return s.split('')
                .reduce(function (a, b) {
                    a = ((a << 5) - a) + b.charCodeAt(0);
                    return a & a
                }, 0);
        },

        /**
         * @param {Node} node
         */
        chevronClick: function (node) {
            if (node.open) {
                this.hideChildren(node);
            } else {
                this.showChildren(node);
            }
        },

        /**
         * @param {Node} node
         */
        hideChildren: function (node) {
            node.open = false;
            this.prepareDataForVisibleNodes();
            this.update();
        },

        /**
         * @param {Node} node
         */
        showChildren: function (node) {
            node.open = true;
            this.prepareDataForVisibleNodes();
            this.update();
        },

        insertBetween: function (before, after) {
        },

        /**
         * @param {Node} node
         */
        selectNode: function (node) {
            if (!this.isNodeSelectable(node)) {
                return;
            }
            var checked = node.data.checked;
            if (this.settings.validation && this.settings.validation.maxItems) {
                var selectedNodes = this.getSelectedNodes();
                if (!checked && selectedNodes.length >= this.settings.validation.maxItems) {
                    return;
                }
            }

            node.data.checked = !checked;

            this.dispatch.call("nodeSelectedAfter", this, node);
            this.update();
        },

        /**
         * Check whether node can be selected, in some cases like parent selector it should not be possible to select
         * element as it's own parent
         *
         * @param {Node} node
         * @returns {boolean}
         */
        isNodeSelectable: function (node) {
            return this.settings.unselectableElements.indexOf(node.data.identifier) == -1;
        },

        getSelectedNodes: function () {
            var selectedNodes = [];

            this.rootNode.each(function (node) {
                if (node.data.checked) {
                    selectedNodes.push(node)
                }
            });
            return selectedNodes;
        },

        /**
         * @name clickOnIcon
         * @param {Node} node
         */
        clickOnIcon: function (node) {
            console.log('Clicked on icon of node' + node.data.identifier + ' ' + node.data.name);
        },

        /**
         * @name clickOnLabel
         * @param {Node} node
         */
        clickOnLabel: function (node) {
            this.selectNode(node);
        },

        /**
         * @name dblClickOnLabel
         * @param {Node} node
         */
        dblClickOnLabel: function (node) {
            console.log('Double clicked on label of node' + node.data.identifier + ' ' + node.data.name);
        },

        /**
         * Expand all nodes
         */
        expandAll: function () {

            this.rootNode.each(function (node) {
                node.open = true;
            });
            this.prepareDataForVisibleNodes();
            this.update();
        },

        collapseAll: function () {
            this.hideChildren(this.rootNode);
        }

    };

    return SvgTree;
});
