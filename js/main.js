require(['SVGTree'], function(SVGTree) {
    var treeConfiguration = new SVGTree;
    treeConfiguration.initialize('.tree-configuration', {
        'dataUrl': 'tree-configuration.json'
    });

    var treeCategory = new SVGTree;
    treeCategory.initialize('.tree-category', {
        'dataUrl': 'tree-category.json',
        'showCheckboxes': true,
        'showIcons': true
    });

    var treePage = new SVGTree;
    treePage.initialize('.tree-page', {
        'dataUrl': 'tree-page.json',
        'showIcons': true
    });

    var treeFolder = new SVGTree;
    treeFolder.initialize('.tree-folder', {
        'dataUrl': 'tree-folder.json',
        'showIcons': true
    });
});
