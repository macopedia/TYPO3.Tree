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


define(['SvgTree', 'jquery'], function (SvgTree, $) {
    'use strict';

    /**
     * Toolbar class
     * @class
     */
    var Toolbar = function () {
        this.settings = {
            toolbarSelector: '.tree-toolbar',
            collapseAllBtn: '.collapse-all-btn',
            expandAllBtn: '.expand-all-btn',
            searchInput: '.search-input'
        };
        /**
         * @type {SvgTree}
         */
        this.tree = null;
    };

    /**
     * @constructs
     * @param {string} treeSelector
     * @param settings
     */
    Toolbar.prototype.initialize = function (treeSelector, settings) {
        var me = this,
            $treeWrapper = $(treeSelector),
            $toolbar = $treeWrapper.siblings(this.settings.toolbarSelector);
        if (!$treeWrapper.data('svgtree-initialized') || typeof $treeWrapper.data('svgtree') !== 'object') {
            return;
        }
        this.tree = $treeWrapper.data('svgtree');
        $toolbar.find(this.settings.collapseAllBtn).on('click', this.collapseAll.bind(this));
        $toolbar.find(this.settings.expandAllBtn).on('click', this.expandAll.bind(this));
        $toolbar.find(this.settings.searchInput).on('input', function () {
            me.search.call(me, this);
        });
    };

    /**
     * Collapse children of root node
     */
    Toolbar.prototype.collapseAll = function () {
        this.tree.collapseAll();
    };

    /**
     * Expand all nodes
     */
    Toolbar.prototype.expandAll = function () {
        this.tree.expandAll();
    };

    /**
     * Find node by name
     * @param input
     */
    Toolbar.prototype.search = function (input) {
        var me = this,
            name = $(input).val();

        this.tree.rootNode.open = false;
        this.tree.rootNode.eachBefore(function (d, i) {
            var regex = new RegExp(name, 'i');
            if (regex.test(d.data.name)) {
                me.showParents(d);
                d.open = true;
                d.hidden = false;
            } else {
                d.hidden = true;
                d.open = false;
            }
        });
        this.tree.prepareDataForVisibleNodes();
        this.tree.update();
    };

    /**
     * Finds and show all parents of node
     * @param d
     * @returns {boolean}
     */
    Toolbar.prototype.showParents = function (d) {
        if (!d.parent) {
            return true;
        }

        d.parent.hidden = false;
        //expand parent node
        d.parent.open = true;
        this.showParents(d.parent);
    };

    return Toolbar;
});
