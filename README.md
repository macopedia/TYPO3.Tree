# SVGTree

This is a demo for a SVGTree.
It is based on the D3.js v4

Clone repository:

`git clone git@github.com:wmdbsystems/TYPO3.Tree.git`

Install bower components:

`bower install`

Install npm modules

`npm install`

Open index.html in the browser to see demo.

## How does it work

Index.html includes `main.js` which initializes demo trees. 

There are 3 components:

  - SvgTree - a base component, capable of rendering tree with icons
  - SelectTree - extended component used as category tree in TYPO3, capable of rendering checkboxes with 3 states (checked, unchecked and indetermined==some descendant is selected). SelectTree inherits from SvgTree and extend it with checkbox functionality (e.g. by listening to some events).
  - SvgTreeToolbar - a toolbar shown on top of category tree on the demo page.
