require(['SVGTree'], function(SVGTree) {
    SVGTree.initialize('.bigTreeWithCheckboxes', {
        'dataUrl': 'bigdata-checked.json',
        'showCheckboxes': true
     });
});