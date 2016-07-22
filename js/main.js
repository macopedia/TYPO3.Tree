require(['SvgTree', 'CategoryTree', 'PageTree', 'SvgTreeToolbar'], function (SvgTree, CategoryTree, PageTree, Toolbar) {
    var treeConfiguration = new SvgTree;
    treeConfiguration.initialize('.tree-configuration', {
        'dataUrl': 'tree-configuration.json'
    });

    var treeCategory = new CategoryTree;
    treeCategory.initialize('.tree-category', {
        'dataUrl': 'tree-category.json',
        'showCheckboxes': true,
        'inputName': '.selected-nodes',
        'showIcons': true
    });

    var treeCategoryToolbar = new Toolbar;
    treeCategoryToolbar.initialize('.tree-category');

    var treePage = new PageTree;
    treePage.initialize('.tree-page', {
        'dataUrl': 'tree-page.json',
        'showIcons': true
    });

    var treeFolder = new SvgTree;
    treeFolder.initialize('.tree-folder', {
        'dataUrl': 'tree-folder.json',
        'showIcons': true
    });
});
