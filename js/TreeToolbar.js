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
     * TreeToolbar class
     *
     * @constructor
     * @exports TreeToolbar
     */
    var TreeToolbar = function () {
        this.settings = {
            toolbarSelector: '.tree-toolbar',
            collapseAllBtn: '.collapse-all-btn',
            expandAllBtn: '.expand-all-btn',
            searchInput: '.search-input'
        };
        /**
         * jQuery object wrapping the SvgTree
         *
         * @type {jQuery}
         */
        this.treeWrapper = null;

        /**
         * SvgTree instance
         *
         * @type {SvgTree}
         */
        this.tree = null;

        /**
         * Toolbar template
         *
         * @type {jQuery}
         */
        this.template = $(
            '<div class="tree-toolbar btn-toolbar">'+
                '<div class="input-group">' +
                    '<span class="input-group-addon input-group-icon filter"></span>' +
                    '<input type="text" class="form-control search-input" placeholder="Search">' +
                '</div>' +
                '<div class="btn-group">' +
                    '<button type="button" class="btn btn-default expand-all-btn icon-expand-all" title="Expand All"></button>' +
                '</div>' +
                '<div class="btn-group">' +
                    '<button type="button" class="btn btn-default collapse-all-btn icon-collapse-all" title="Collapse All"></button>' +
                '</div>' +
            '</div>'
        )
    };

    /**
     * Toolbar initialization
     *
     * @param {String} treeSelector
     * @param {Object} settings
     */
    TreeToolbar.prototype.initialize = function (treeSelector, settings) {
        var me = this;
        this.treeWrapper = $(treeSelector);
        if (!this.treeWrapper.data('svgtree-initialized') || typeof this.treeWrapper.data('svgtree') !== 'object') {
            //both toolbar and tree are loaded independently through require js, so we don't know which is loaded first
            //in case of toolbar being loaded first, we wait for an event from svgTree
            this.treeWrapper.on('svgTree.initialized', this.render.bind(me));
            return;
        }
        $.extend(this.settings, settings);
        this.render();
    };

    /**
     * Renders toolbar
     */
    TreeToolbar.prototype.render = function () {
        var me = this;
        this.tree = this.treeWrapper.data('svgtree');
        var $toolbar = this.template.clone().insertBefore(this.treeWrapper);

        $toolbar.find(this.settings.collapseAllBtn).on('click', this.collapseAll.bind(this));
        $toolbar.find(this.settings.expandAllBtn).on('click', this.expandAll.bind(this));
        $toolbar.find(this.settings.searchInput).on('input', function () {
            me.search.call(me, this);
        });
    };

    /**
     * Collapse children of root node
     */
    TreeToolbar.prototype.collapseAll = function () {
        this.tree.collapseAll();
    };

    /**
     * Expand all nodes
     */
    TreeToolbar.prototype.expandAll = function () {
        this.tree.expandAll();
    };

    /**
     * Find node by name
     *
     * @param {HTMLElement} input
     */
    TreeToolbar.prototype.search = function (input) {
        var me = this,
            name = $(input).val();

        this.tree.rootNode.open = false;
        this.tree.rootNode.eachBefore(function (node, i) {
            var regex = new RegExp(name, 'i');
            if (regex.test(node.data.name)) {
                me.showParents(node);
                node.open = true;
                node.hidden = false;
            } else {
                node.hidden = true;
                node.open = false;
            }
        });
        this.tree.prepareDataForVisibleNodes();
        this.tree.update();
    };

    /**
     * Finds and show all parents of node
     *
     * @param {Node} node
     * @returns {Boolean}
     */
    TreeToolbar.prototype.showParents = function (node) {
        if (!node.parent) {
            return true;
        }

        node.parent.hidden = false;
        //expand parent node
        node.parent.open = true;
        this.showParents(node.parent);
    };

    return TreeToolbar;
});
