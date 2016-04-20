

define(['jquery', 'd3', 'FastClick', 'underscore'], function($, d3, FastClick, _) {
    'use strict';

    var SVGTree = {
        showCheckboxes: true,
        nodeHeight: 20,
        indentWidth: 16,
        duration: 400,
        viewportHeight: 0,
        scrollTop: 0,
        scrollHeight: 0,
        scrollBottom: 0,
        tree: null,
        svg: null,
        iconElements: null,
        dragElement: null,
        container: null,
        linkElements: null,
        nodeElements: null,
        drag: null,
        root: null,
        lastDragY: null,
        throttledDragmove: null,
        data: {}
    };

    /**
     *
     */
    SVGTree.initialize = function(selector) {
        SVGTree.tree = d3.layout.tree();
        SVGTree.svg = d3
            .select(selector)
            .append('svg')
            .attr('version', '1.1');
        SVGTree.iconElements = SVGTree.svg.append('defs');
        SVGTree.dragElement = SVGTree.svg
            .append('rect')
            .attr('visibility', 'hidden')
            .attr('x', 0)
            .attr('y', 0)
            .style('fill', '#D6E7F7')
            .attr('width', '100%')
            .attr('height', SVGTree.nodeHeight);
        SVGTree.container = SVGTree.svg
            .append('g')
            .attr('transform', 'translate(' + (SVGTree.indentWidth / 2)  + ',' + (SVGTree.nodeHeight / 2) + ')');
        SVGTree.linkElements = SVGTree.container.append('g')
            .attr('class', 'links');
        SVGTree.nodeElements = SVGTree.container.append('g')
            .attr('class', 'nodes');
        SVGTree.drag = d3.behavior.drag()
            .origin(Object)
            .on('dragstart', SVGTree.dragstart)
            .on('drag', SVGTree.dragmove)
            .on('dragend', SVGTree.dragend);

        SVGTree.updateScrollPosition();
        SVGTree.loadData();

        d3.select(document).on('scroll', function() {
            SVGTree.updateScrollPosition();
            SVGTree.update();
        });

        document.addEventListener('DOMContentLoaded', function() {
            FastClick.attach(document.getElementById('body'));
        }, false);

        SVGTree.throttledDragmove = _.throttle(function() {
            var currentRow = (Math.round(( SVGTree.lastDragY / SVGTree.nodeHeight ) * 2) / 2);
            var dragElementHeight = currentRow % 1 ? 1 : SVGTree.nodeHeight;
            var dragElementY = (currentRow * SVGTree.nodeHeight) + (currentRow % 1 ? (SVGTree.nodeHeight / 2) : 0);
            SVGTree.dragElement
                .attr('visibility', 'visible')
                .attr('transform', SVGTree.xy({x:0, y: dragElementY}))
                .attr('height', dragElementHeight);
        }, 40);

    };

    SVGTree.updateScrollPosition = function() {
        SVGTree.viewportHeight = parseInt(window.innerHeight);
        SVGTree.scrollTop = window.scrollY - (SVGTree.viewportHeight / 2);
        SVGTree.scrollHeight = parseInt(window.document.body.clientHeight);
        SVGTree.scrollBottom = SVGTree.scrollTop + SVGTree.viewportHeight + (SVGTree.viewportHeight / 2);
        SVGTree.viewportHeight = SVGTree.viewportHeight * 2;
    };

    SVGTree.loadData = function() {
        d3.json('faker.php', function (error, flare) {
            if (error) throw error;
            flare = SVGTree.tree.nodes(flare);
            flare.forEach(function(n) {
                n.open = true;
                n.hasChildren = (n.children || n._children) ? 1 : 0;
                if (SVGTree.showCheckboxes) {
                    n.indeterminate = SVGTree.isIndeterminate(n);
                }
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
            });
            SVGTree.root = flare;
            SVGTree.renderData();
            SVGTree.update();
        });
    };

    SVGTree.isIndeterminate = function(n) {
        /**
         * Display states for the node
         *
         * checked: node is checked
         * unchecked: node is unchecked and all children are unchecked
         * indeterminate: node is unchecked and at least one child is checked
         *
         */

        // indeterminate status already known
        if (typeof n.indeterminate === 'boolean') {
            return n.indeterminate;
        }

        // if a node has no children it cannot be indeterminate, if it is checked itself don't hide that by overlaying with indeterminate state
        if (!n.children || n.checked) {
            return false;
        }

        return SVGTree.hasCheckedChildren(n);
    };

    // recursive function to check if at least child is checked
    SVGTree.hasCheckedChildren = function(n) {

        if (!n.children) {
            return n.checked;
        }

        var hasCheckedChildren = false;
        n.children.some(function (child) {
            hasCheckedChildren = SVGTree.hasCheckedChildren(child);
            // save child's indeterminate status to speed up detection
            child.indeterminate = (!child.children || child.checked) ? false : hasCheckedChildren;

            // return in some() skips rest if true
            return hasCheckedChildren;
        });
        return hasCheckedChildren;
    };

    SVGTree.renderData = function() {
        var blacklist = {};
        SVGTree.root.forEach(function(node) {
            if (!node.open) {
                blacklist[node.identifier] = true;
            }
        });
        SVGTree.data.nodes = SVGTree.root.filter(function(node) {
            return !node.parents.some(function(id) {
                return Boolean(blacklist[id]);
            });
        });
        var iconHashes = [];
        SVGTree.data.links = [];
        SVGTree.data.icons = [];
        SVGTree.data.nodes.forEach(function(n, i) {
            delete n.children;
            n.x = n.depth * SVGTree.indentWidth;
            n.y = i * SVGTree.nodeHeight;
            if (n.parent) {
                SVGTree.data.links.push({
                    source: n.parent,
                    target: n
                });
            }
            if (!n.iconHash) {
                n.iconHash = Math.abs(SVGTree.hashCode(n.icon));
                if (iconHashes.indexOf(n.iconHash) === -1) {
                    iconHashes.push(n.iconHash);
                    SVGTree.data.icons.push({
                        identifier: n.iconHash,
                        icon: n.icon
                    });
                }
                delete n.icon;
            }
        });
    };

    SVGTree.update = function() {
        var visibleRows = Math.ceil(SVGTree.viewportHeight / SVGTree.nodeHeight + 1);
        var position = Math.floor(Math.max(SVGTree.scrollTop, 0) / SVGTree.nodeHeight);
        var visibleNodes = SVGTree.data.nodes.slice(position, position + visibleRows);
        var visibleLinks = SVGTree.data.links.filter(function(d) {
            return d.source.y <= SVGTree.scrollBottom && SVGTree.scrollTop <= d.target.y;
        });

        SVGTree.svg.attr('height', SVGTree.data.nodes.length * SVGTree.nodeHeight);

        var icons = SVGTree.iconElements
            .selectAll('.icon-def')
            .data(SVGTree.data.icons, function(i) { return i.identifier; });

        icons
            .enter()
            .append('g')
            .attr('class', 'icon-def')
            .attr('id', function(i) { return 'icon-' + i.identifier; })
            .html(function(i) { return i.icon.replace('<svg', '<g').replace('/svg>', '/g>'); });

        var links = SVGTree.linkElements
            .selectAll('.link')
            .data(visibleLinks);

        // create
        links
            .enter()
            .append('path')
            .attr('class', 'link');

        // update
        links
            .attr('d', SVGTree.squaredDiagonal);

        // delete
        links
            .exit()
            .remove();

        var nodes = SVGTree.nodeElements
            .selectAll('.node')
            .data(visibleNodes);

        // create the node elements
        var nodeEnter = nodes
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', SVGTree.xy)
            .call(SVGTree.drag);

        // append the chevron element
        var chevron = nodeEnter
            .append('g')
            .attr('class', 'toggle')
            .on('click', SVGTree.click);

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
        nodeEnter
            .append('use')
            .attr('x', 8)
            .attr('y', -8);

        if (SVGTree.showCheckboxes) {

            // @todo Check foreignObject/checkbox support on IE/Edge
            // @todo Zooming the page containing the svg does not resize/reposition the checkboxes in Safari
            nodeEnter
                .append('foreignObject')
                .attr('x', 24)
                .attr('y', -8)
                .attr('width', 20)
                .attr('height', 20)
                .append("xhtml:div")
                .html('<input class="check" type="checkbox">');
        }


        // append the text element
        nodeEnter
            .append('text')
            .attr('dx', SVGTree.showCheckboxes ? 45 : 27)
            .attr('dy', 5);

        // update
        nodes
            .attr('transform', SVGTree.xy)
            .select('text')
            .text(function(d) { return d.name + (SVGTree.showCheckboxes && d.checked ? ' (checked)' : ''); });
        nodes
            .select('.toggle')
            .attr('transform', function(d) { return d.open ? 'translate(8 -8) rotate(90)' : 'translate(-8 -8) rotate(0)' ; })
            .attr('visibility', function(d) { return d.hasChildren ? 'visible' : 'hidden'; });
        nodes
            .select('use')
            .attr('xlink:href', function(n) { return '#icon-' + n.iconHash; });

        if (SVGTree.showCheckboxes) {
            nodes
                .select('.check')
                .attr('checked', function (n) { return n.checked ? 'checked' : null; })
                .property('indeterminate', function (n) { return n.indeterminate; });
        }

        // delete
        nodes
            .exit()
            .remove();
    };

    SVGTree.squaredDiagonal = function(d) {
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
            path.push('H' + (target.x + SVGTree.indentWidth / 4));
        }
        return path.join(' ');
    };

    SVGTree.xy = function(d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    };

    SVGTree.hashCode = function(s) {
        return s.split('')
            .reduce(function(a,b) {
                a = ((a<<5)-a) + b.charCodeAt(0);
                return a&a
            }, 0);
    };

    SVGTree.click = function(d) {
        if (d.open) {
            SVGTree.hideChildren(d);
        } else {
            SVGTree.showChildren(d);
        }
        SVGTree.update();
    };

    SVGTree.updateScrollPosition = function() {
        SVGTree.viewportHeight = parseInt(window.innerHeight);
        SVGTree.scrollTop = window.scrollY - (SVGTree.viewportHeight / 2);
        SVGTree.scrollHeight = parseInt(window.document.body.clientHeight);
        SVGTree.scrollBottom = SVGTree.scrollTop + SVGTree.viewportHeight + (SVGTree.viewportHeight / 2);
        SVGTree.viewportHeight = SVGTree.viewportHeight * 2;
    };

    SVGTree.dragstart = function(d) {
        d._isDragged = true;
    };

    SVGTree.dragmove = function(d) {
        SVGTree.lastDragY = d3.event.y;
        SVGTree.throttledDragmove(d);
    };

    SVGTree.dragend = function(d) {
        d._isDragged = false;
        SVGTree.dragElement
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
    };

    SVGTree.hideChildren = function(d) {
        d.open = false;
        SVGTree.renderData();
        SVGTree.update();
    };

    SVGTree.showChildren = function(d) {
        d.open = true;
        SVGTree.renderData();
        SVGTree.update();
    };

    SVGTree.insertBetween = function(before, after) {

    };

    return SVGTree;
});
