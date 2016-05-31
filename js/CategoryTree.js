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

    CategoryTree.prototype.updateNodes = function (nodes) {
        if (this.settings.showCheckboxes) {
                nodes
                    .select('.check')
                    .attr('checked', this.updateCheckboxChecked)
                    .property('indeterminate', this.updateCheckboxIndeterminate);
            }
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
        if (typeof node.indeterminate === 'boolean') {
            return node.indeterminate;
        }

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

    CategoryTree.prototype.initialize = function(selector, settings) {
        _super_.initialize.call(this, selector, settings);
        this.dispatch.on('updateNodes.category', this.updateNodes);
        this.dispatch.on('prepareLoadedNode.category', this.prepareLoadedNode);
    };

    CategoryTree.prototype.updateTextNode = function(node) {
        return _super_.updateTextNode.call(this, node) + (this.settings.showCheckboxes && node.checked ? ' (checked)' : '');
    };

    return CategoryTree;
}
);