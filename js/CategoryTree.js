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


define(['SvgTree'], function(SvgTree) {
    'use strict';

    var CategoryTree = function() {
        SvgTree.call(this);
        this.settings.showCheckboxes = true;
    };

    CategoryTree.prototype = Object.create(SvgTree.prototype);
    var _super_ = SvgTree.prototype;

    CategoryTree.prototype.initialize = function(selector, settings) {
        _super_.initialize.call(this, selector, settings);
        this.addIcons();
        this.dispatch.on('updateNodes.category', this.updateNodes);
        this.dispatch.on('prepareLoadedNode.category', this.prepareLoadedNode);
        this.dispatch.on('renderCheckbox.category', this.renderCheckbox);
    };

    CategoryTree.prototype.updateNodes = function (nodes) {
        var me = this;
        if (this.settings.showCheckboxes) {
               nodes
                   .select('.tree-check')
                   .property('indeterminate', function(d){
                       return me.isCheckboxIndeterminate(d);
                   })
                   .attr('xlink:href', function (d) {
                        if (me.updateCheckboxChecked(d)) {
                            return '#icon-checked'
                        } else if (me.updateCheckboxIndeterminate(d)) {
                            return '#icon-indeterminate';
                        } else {
                            return '#icon-check'
                        }
                    });
            }
    };

    CategoryTree.prototype.renderCheckbox = function (node) {
        var me = this;
        if (this.settings.showCheckboxes) {
            this.textPosition = 50;

            node
                .append('use')
                .attr('class','tree-check')
                .attr('x', 28)
                .attr('y', -8)
                .on('click', function(d){
                    me.selectNode(d);
                });
        }
    };

    CategoryTree.prototype.updateCheckboxChecked = function (node) {
        return node.checked ? 'true' : null;
    };

    CategoryTree.prototype.updateCheckboxIndeterminate = function(node) {
        return node.indeterminate;
    };

    CategoryTree.prototype.isCheckboxIndeterminate = function(node) {
        /**
         * Display states for the node
         *
         * checked: node is checked
         * unchecked: node is unchecked and all children are unchecked
         * indeterminate: node is unchecked and at least one child is checked
         *
         */

        // indeterminate status already known

        // if a node has no children it cannot be indeterminate, if it is checked itself don't hide that by overlaying with indeterminate state
        if (!node.children || node.checked) {
            return false;
        }

        return this.hasCheckedChildren(node);
    };

    CategoryTree.prototype.hasCheckedChildren = function(n) {
        var me = this;

        if (!n.children) {
            return n.checked;
        }

        var hasCheckedChildren = false;
        n.children.some(function (child) {
            hasCheckedChildren = me.hasCheckedChildren(child);
            // save child's indeterminate status to speed up detection
            child.indeterminate = (!child.children || child.checked) ? false : hasCheckedChildren;

            // return in some() skips rest if true
            return hasCheckedChildren;
        });
        return hasCheckedChildren;
    };

    CategoryTree.prototype.prepareLoadedNode = function (node) {
        if (this.settings.showCheckboxes) {
                node.indeterminate = this.isCheckboxIndeterminate(node);
        }
    };

    CategoryTree.prototype.updateTextNode = function(node) {
        return _super_.updateTextNode.call(this, node) + (this.settings.showCheckboxes && node.checked ? ' (checked)' : '');
    };

    /**
     * Add icons imitating checkboxes
     */
    CategoryTree.prototype.addIcons = function () {

        var iconsData = [
            {
                identifier: 'icon-check',
                icon: '<g width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">' +
                '<rect height="16" width="16" fill="transparent"/><path transform="scale(0.01)" d="M1312 256h-832q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113v-832q0-66-47-113t-113-47zm288 160v832q0 119-84.5 203.5t-203.5 84.5h-832q-119 0-203.5-84.5t-84.5-203.5v-832q0-119 84.5-203.5t203.5-84.5h832q119 0 203.5 84.5t84.5 203.5z"/></g>'
            },
            {
                identifier: 'icon-checked',
                icon: '<g width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect height="16" width="16" fill="transparent"/><path transform="scale(0.01)" d="M813 1299l614-614q19-19 19-45t-19-45l-102-102q-19-19-45-19t-45 19l-467 467-211-211q-19-19-45-19t-45 19l-102 102q-19 19-19 45t19 45l358 358q19 19 45 19t45-19zm851-883v960q0 119-84.5 203.5t-203.5 84.5h-960q-119 0-203.5-84.5t-84.5-203.5v-960q0-119 84.5-203.5t203.5-84.5h960q119 0 203.5 84.5t84.5 203.5z"/></g>'
            },
            {
                identifier: 'icon-indeterminate',
                icon: '<g width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><rect height="16" width="16" fill="transparent"/><path transform="scale(0.01)" d="M1344 800v64q0 14-9 23t-23 9h-832q-14 0-23-9t-9-23v-64q0-14 9-23t23-9h832q14 0 23 9t9 23zm128 448v-832q0-66-47-113t-113-47h-832q-66 0-113 47t-47 113v832q0 66 47 113t113 47h832q66 0 113-47t47-113zm128-832v832q0 119-84.5 203.5t-203.5 84.5h-832q-119 0-203.5-84.5t-84.5-203.5v-832q0-119 84.5-203.5t203.5-84.5h832q119 0 203.5 84.5t84.5 203.5z"/></g>'
            }
        ];


        var icons = this.iconElements
            .selectAll('.icon-def')
            .data(iconsData);
        icons
            .enter()
            .append('g')
            .attr('class', 'icon-def')
            .attr('id',function (i) {
                return i.identifier;
            })
            .html(function (i) {
                return i.icon;
            });

    };

    return CategoryTree;
});
