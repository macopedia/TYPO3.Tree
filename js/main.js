require(['SVGTree'], function(SVGTree) {
    var tree = new SVGTree;
    tree.initialize('.bigTreeWithCheckboxes', {
        'dataUrl': 'bigdata-checked.json',
        'showCheckboxes': true
     });

    var tree2 = new SVGTree;
    tree2.initialize('.bigTreeSecond', {
        'dataUrl': 'bigdata-checked.json',
        'showCheckboxes': false
    });
});
