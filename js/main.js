require(['SvgTree', 'CategoryTree', 'PageTree'], function(SvgTree, CategoryTree, PageTree) {
    var treeConfiguration = new SvgTree;
    treeConfiguration.initialize('.tree-configuration', {
        'dataUrl': 'tree-configuration.json'
    });

    var treeCategory = new CategoryTree;
    treeCategory.initialize('.tree-category', {
        'dataUrl': 'tree-category.json',
        'showCheckboxes': true,
        'showIcons': true
    });

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
