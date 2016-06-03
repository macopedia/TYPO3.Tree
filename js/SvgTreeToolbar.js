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


define(['SvgTree', 'jquery'], function(SvgTree, $) {
    'use strict';

    /**
     * Toolbar class
     * @class
     */
    var Toolbar = function () {
        SvgTree.call(this);

        this.settings = {
            $collapseBtn: '.collapse-btn',
            $uncollapseBtn: '.uncollapse-btn',
            $searchInput: '.search-input'
        }

    };

    Toolbar.prototype = Object.create(SvgTree.prototype);

    /**
     * @constructs
     * @param toolbar
     * @param tree
     * @param settings
     */
    Toolbar.prototype.initialize = function(toolbar, tree, settings) {
        var me = this,
            $toolbar = $(toolbar);

        if (typeof tree !== 'undefined') {
            this.tree = tree;
        }

        $toolbar.find(this.settings.$collapseBtn).on('click', this.collapse.bind(this));
        $toolbar.find(this.settings.$uncollapseBtn).on('click', this.uncollapse.bind(this));
        $toolbar.find(this.settings.$searchInput).on('input', function(){
            me.search.call(me, this);
        });
    };

    /**
     * Collapse childrens of root node
     */
    Toolbar.prototype.collapse = function() {
        this.tree.hideChildren(this.tree.root[0]);
    };

    /**
     * Uncollapse childrens of root node
     */
    Toolbar.prototype.uncollapse = function() {
        var me = this;

        this.tree.root.forEach(function(d){
            if(d.open == false){
                me.tree.showChildren(d);
            }
        });
    };

    /**
     * Find node by name
     * @param input
     */
    Toolbar.prototype.search = function(input) {
        var me = this,
            name = $(input).val();

        this.tree.hideChildren(this.tree.root[0]);
        this.tree.root.forEach(function(d, i){
            if(d.name == name){
                me.showParents(d);
                me.tree.showChildren(d);
                d.hidden = false;
            }else {
                d.hidden = true;
                me.tree.hideChildren(d);
            }
        });
    };

    /**
     * Finds and show all parents of node
     * @param d
     * @returns {boolean}
     */
    Toolbar.prototype.showParents = function(d) {
        if(!d.parent) {
            return true;
        }

        d.parent.hidden = false;
        this.tree.showChildren(d.parent);
        this.showParents(d.parent);
    };

    return Toolbar;
});
