/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */


define(['SvgTree', 'FastClick', 'underscore', 'd3'], function (SvgTree, FastClick, _, d3) {
        'use strict';

        var PageTree = function () {
            SvgTree.call(this);
            this.drag = null;
            this.lastDragY = null;
            this.throttledDragmove = null;
            this.dragElement = null;
        };
        PageTree.prototype = Object.create(SvgTree.prototype);
        var _super_ = SvgTree.prototype;
        PageTree.prototype.initialize = function (selector, settings) {
            _super_.initialize.call(this, selector, settings);
            var me = this;
            this.dragElement = this.svg
                .append('rect')
                .attr('visibility', 'hidden')
                .attr('x', 0)
                .attr('y', 0)
                .style('fill', '#D6E7F7')
                .attr('width', '100%')
                .attr('height', this.settings.nodeHeight);

            this.drag = d3.drag()
                .on('.dragstart', this.dragstart.bind(me))
                .on('drag', this.dragmove.bind(me))
                .on('.dragend', this.dragend.bind(me));
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
            this.dispatch.on('updateSvg.pageTree', this.updateSvg);
        };

        PageTree.prototype.dragstart = function (d) {
            d._isDragged = true;
        };

        PageTree.prototype.dragmove = function (d) {
            this.lastDragY = d3.event.y;
            this.throttledDragmove(d);
        };

        PageTree.prototype.dragend = function (d) {
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
        };
        PageTree.prototype.updateSvg = function (nodes) {
            nodes.call(this.drag);
        };
        return PageTree;
    }
);
