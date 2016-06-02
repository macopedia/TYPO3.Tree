

define(['jquery', 'd3', 'FastClick', 'underscore'], function($, d3, FastClick, _) {
    'use strict';



    var SvgTree = function(){
        this.settings = {
            showCheckboxes: false,
            showIcons: false,
            nodeHeight: 20,
            indentWidth: 16,
            duration: 400,
            dataUrl: 'tree-configuration.json'
        };

        this.viewportHeight = 0;
        this.scrollTop = 0;
        this.scrollHeight = 0;
        this.scrollBottom = 0;
        this.tree = null;
        this.svg = null;
        this.iconElements = null;
        this.dragElement = null;
        this.container = null;
        this.linkElements = null;
        this.nodeElements = null;
        this.drag = null;
        this.root = null;
        this.lastDragY = null;
        this.throttledDragmove = null;
        this.data = {};
        this.visibleRows = 0;
        this.position = 0;
        this.visibleNodesCount = 0;
        this.dispatch = null;
    };

    SvgTree.prototype = {
        constructor: SvgTree,

        initialize: function(selector, settings) {
            $.extend(this.settings, settings);
            var me = this;
            this.dispatch = d3.dispatch('updateNodes', 'renderCheckbox', 'prepareLoadedNode', 'selectedNode');
            this.tree = d3.layout.tree();
            this.svg = d3
                .select(selector)
                .append('svg')
                .attr('version', '1.1');
            this.dragElement = this.svg
                .append('rect')
                .attr('visibility', 'hidden')
                .attr('x', 0)
                .attr('y', 0)
                .style('fill', '#D6E7F7')
                .attr('width', '100%')
                .attr('height', this.settings.nodeHeight);
            this.container = this.svg
                .append('g')
                .attr('transform', 'translate(' + (this.settings.indentWidth / 2) + ',' + (this.settings.nodeHeight / 2) + ')');
            this.linkElements = this.container.append('g')
                .attr('class', 'links');
            this.nodeElements = this.container.append('g')
                .attr('class', 'nodes');
            this.drag = d3.behavior.drag()
                .origin(Object)
                .on('dragstart', this.dragstart.bind(me))
                .on('drag', this.dragmove.bind(me))
                .on('dragend', this.dragend.bind(me));

            if (this.settings.showIcons) {
                this.iconElements = this.svg.append('defs');
            }


            this.updateScrollPosition();
            this.loadData();

            $(window).on('resize scroll', function () {
                me.updateScrollPosition();
                me.update();
            });

            document.addEventListener('DOMContentLoaded', function () {
                FastClick.attach(document.querySelector(selector));
            }, false);

            this.throttledDragmove = _.throttle(function () {
                var currentRow = (Math.round(( me.lastDragY / me.settings.nodeHeight ) * 2) / 2);
                var dragElementHeight = currentRow % 1 ? 1 : me.settings.nodeHeight;
                var dragElementY = (currentRow * me.settings.nodeHeight) + (currentRow % 1 ? (me.settings.nodeHeight / 2) : 0);
                me.dragElement
                    .attr('visibility', 'visible')
                    .attr('transform', this.xy({x: 0, y: dragElementY}))
                    .attr('height', dragElementHeight);
            }, 40);


        },

        updateScrollPosition: function(){
            this.viewportHeight = parseInt(window.innerHeight);
            this.scrollTop = Math.max(0, window.pageYOffset - (this.viewportHeight / 2));
            this.scrollHeight = parseInt(window.document.body.clientHeight);
            this.scrollBottom = this.scrollTop + this.viewportHeight + (this.viewportHeight / 2);
            this.viewportHeight = this.viewportHeight * 1.5;
        },

        loadData: function(){
            var me = this;
            d3.json(this.settings.dataUrl, function (error, json) {
                if (error) throw error;
                if (Array.isArray(json)) {
                    //little hack, so we can use json structure prepared by ExtJsJsonTreeRenderer
                    json = json[0];
                }
                json = me.tree.nodes(json);
                json.forEach(function(n) {
                    n.open = true;
                    n.hasChildren = (n.children || n._children) ? 1 : 0;
                    n.parents = [];
                    n._isDragged = false;
                    if (n.parent) {
                        var x = n;
                        while (x && x.parent) {
                            if (x.parent.identifier) {
                                n.parents.push(x.parent.identifier);
                            }
                            x = x.parent;
                        }
                    }
                    //dispatch event
                    me.dispatch.prepareLoadedNode.call(me, n);
                });
                me.root = json;
                me.renderData();
                me.update();
            });
        },

        // recursive function to check if at least child is checked


        renderData: function() {
            var me = this;

            var blacklist = {};
            this.root.forEach(function(node) {
                if (!node.open) {
                    blacklist[node.identifier] = true;
                }
            });
            this.data.nodes = this.root.filter(function(node) {
                return !node.parents.some(function(id) {
                    return Boolean(blacklist[id]);
                });
            });
            var iconHashes = [];
            this.data.links = [];
            this.data.icons = [];
            this.data.nodes.forEach(function(n, i) {
                //delete n.children;
                n.x = n.depth * me.settings.indentWidth;
                n.y = i * me.settings.nodeHeight;
                if (n.parent) {
                    me.data.links.push({
                        source: n.parent,
                        target: n
                    });
                }
                if (!n.iconHash && me.settings.showIcons && n.icon) {
                    n.iconHash = Math.abs(me.hashCode(n.icon));
                    if (iconHashes.indexOf(n.iconHash) === -1) {
                        iconHashes.push(n.iconHash);
                        me.data.icons.push({
                            identifier: n.iconHash,
                            icon: n.icon
                        });
                    }
                    delete n.icon;
                }
            });
            this.svg.attr('height', this.data.nodes.length * this.settings.nodeHeight);
        },

        update: function() {
            var me = this;
            var visibleRows = Math.ceil(this.viewportHeight / this.settings.nodeHeight + 1);
            var position = Math.floor(Math.max(this.scrollTop, 0) / this.settings.nodeHeight);
            var visibleNodes = this.data.nodes.slice(position, position + visibleRows);

            var nodes = this.nodeElements.selectAll('.node').data(visibleNodes);

            if (this.visibleRows !== visibleRows || this.position !== position || this.visibleNodesCount !== visibleNodes.length) {
                this.visibleRows = visibleRows;
                this.position = position;
                this.visibleNodesCount = visibleNodes.length;
                this.updateSVGElements(nodes);
            }

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
            this.dispatch.updateNodes.call(this, nodes);

            // delete
            nodes
                .exit()
                .remove();


        },

        updateTextNode: function(node) {
            return node.name;
        },

        updateToggleTransform: function(node) {
            return node.open ? 'translate(8 -8) rotate(90)' : 'translate(-8 -8) rotate(0)' ;
        },

        updateToggleVisibility: function(node) {
            return node.hasChildren ? 'visible' : 'hidden';
        },

        updateIconId: function(node) {
            return '#icon-' + node.iconHash;
        },

        updateSVGElements: function(nodes) {
            var me = this;
            me.textPosition = 10;

            if(me.settings.showIcons) {
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
                    .html(function (i) {
                        /* @todo html() method doesn't work with svg elements (IE problem) */
                        return i.icon.replace('<svg', '<g').replace('/svg>', '/g>');
                    });
            }
            var visibleLinks = this.data.links.filter(function(d) {
                return d.source.y <= me.scrollBottom && me.scrollTop <= d.target.y;
            });

            var links = this.linkElements
                .selectAll('.link')
                .data(visibleLinks);

            // create
            links
                .enter()
                .append('path')
                .attr('class', 'link');

            // update
            links
                .attr('d', this.squaredDiagonal.bind(me));

            // delete
            links
                .exit()
                .remove();

            // create the node elements
            var nodeEnter = nodes
                .enter()
                .append('g')
                .attr('class', 'node')
                .attr('transform', this.xy)
                .call(this.drag);

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

            // append checkbox
            this.dispatch.renderCheckbox.call(me, nodeEnter);

            // append the text element
            nodeEnter
                .append('text')
                .attr('dx', me.textPosition)
                .attr('dy', 5)
                .on('click', function(d){
                    me.clickOnLabel(d);
                })
                .on('dblclick', me.dblClickOnLabel);
        },

        squaredDiagonal: function(d) {
            var me = this;

            var target = {
                x: d.target._isDragged ? d.target._x : d.target.x,
                y: d.target._isDragged ? d.target._y : d.target.y
            };
            var path = [];
            path.push('M' + d.source.x + ' ' + d.source.y);
            path.push('V' + target.y);
            if (target.hasChildren) {
                path.push('H' + target.x);
            } else {
                path.push('H' + (target.x + me.settings.indentWidth / 4));
            }
            return path.join(' ');
        },

        xy: function(d) {
            return 'translate(' + d.x + ',' + d.y + ')';
        },

        hashCode: function(s) {
            return s.split('')
                .reduce(function(a,b) {
                    a = ((a<<5)-a) + b.charCodeAt(0);
                    return a&a
                }, 0);
        },

        chevronClick: function(d) {
            if (d.open) {
                this.hideChildren(d);
            } else {
                this.showChildren(d);
            }
            this.update();
        },

        dragstart: function(d) {
            d._isDragged = true;
        },

        dragmove: function(d) {
            this.lastDragY = d3.event.y;
            this.throttledDragmove(d);
        },

        dragend: function(d) {
            d._isDragged = false;
            this.dragElement
                .attr('visibility', 'hidden');
            // var currentRow = (Math.round(( lastDragY / nodeHeight ) * 2) / 2);
            // var elementBeforePosition = Math.floor(currentRow);
            // var elementBefore = root[elementBeforePosition];
            // var elementAfter = root[elementBeforePosition + 1];
            // if (currentRow % 1) {
            //     insertBetween(elementBefore, elementAfter);
            // } else {
            //
            // }
        },

        hideChildren: function(d) {
            d.open = false;
            this.renderData();
            this.update();
        },

        showChildren: function(d) {
            d.open = true;
            this.renderData();
            this.update();
        },

        insertBetween: function(before, after) {},

        /**
         * @name selectNode
         * @param d
         */

        selectNode: function (d) {
            if(d.checked){
                d.checked = null;
            } else {
                d.checked = true;
            }

            this.dispatch.selectedNode.call(this);
            this.update();
        },

        /**
         * @name clickOnIcon
         * @param d
         */
        clickOnIcon: function(d) {
            console.log('Clicked on icon of node' + d.identifier + ' ' + d.name);
        },

        /**
         * @name clickOnLabel
         * @param d
         */
        clickOnLabel: function(d) {
            this.selectNode(d);
        },

        /**
         * @name dblClickOnLabel
         * @param d
         */
        dblClickOnLabel: function(d) {
            console.log('Double clicked on label of node' + d.identifier + ' ' + d.name);
        }

    };

    return SvgTree;
});
