require(['SvgTree', 'SelectTree', 'PageTree', 'TreeToolbar'], function (SvgTree, SelectTree, PageTree, TreeToolbar) {
    var treeConfiguration = new SvgTree;
    treeConfiguration.initialize('.tree-configuration', {
        'dataUrl': 'tree-configuration.json',
        'expandUpToLevel': 3
    });

    var treeCategory = new SelectTree;
    treeCategory.initialize('.tree-category', {
        'dataUrl': 'tree-category.json',
        'showCheckboxes': true,
        'inputName': '.selected-nodes',
        'showIcons': true,
        'unselectableElements': ['573b150a78e4f228880592'],
        'expandUpToLevel': 3
    });

    var treeCategoryToolbar = new TreeToolbar;
    treeCategoryToolbar.initialize('.tree-category');

    var treePage = new PageTree;
    treePage.initialize('.tree-page', {
        'dataUrl': 'tree-page.json',
        'showIcons': true,
        'expandUpToLevel': 3
    });

    var treeFolder = new SvgTree;
    treeFolder.initialize('.tree-folder', {
        'dataUrl': 'tree-folder.json',
        'showIcons': true,
        'expandUpToLevel': 3
    });
});
