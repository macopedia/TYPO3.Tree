<?php
$words = explode("\r", file_get_contents(__DIR__ . '/words.txt'));
$words = array_map('trim', $words);
$wordsCount = count($words);

$icons = [
    '<svg width="16" height="16" version="1.1" class="t3js-icon icon icon-size-small icon-state-default icon-apps-pagetree-page-default" data-identifier="apps-pagetree-page-default">
      <text class="fa" x="8" y="8" width="16" height="16" font-size="16" text-anchor="middle" alignment-baseline="middle">&#xf0f2;</text>
      <image xlink:href="t3-icons/overlay-hidden.svg" x="6" y="6" width="10" height="10" />
    </svg>',
    '<svg width="16" height="16" version="1.1" class="t3js-icon icon icon-size-small icon-state-default icon-apps-pagetree-page-default" data-identifier="apps-pagetree-page-default">
        <image xlink:href="t3-icons/apps-pagetree-page-default.svg" width="16" height="16" />
        <image xlink:href="t3-icons/overlay-hidden.svg" x="6" y="6" width="10" height="10" />
    </svg>',
    '<svg width="16" height="16" version="1.1" class="t3js-icon icon icon-size-small icon-state-default icon-apps-pagetree-page-default" data-identifier="apps-pagetree-page-default">
        <image xlink:href="t3-icons/apps-pagetree-page-default.svg" width="16" height="16" />
    </svg>',
    '<svg width="16" height="16" version="1.1" class="t3js-icon icon icon-size-small icon-state-default icon-apps-pagetree-folder-default" data-identifier="apps-pagetree-folder-default">
        <image xlink:href="t3-icons/apps-pagetree-folder-default.svg" width="16" height="16" />
        <image xlink:href="t3-icons/overlay-hidden.svg" x="6" y="6" width="10" height="10" />
    </svg>',
    '<svg width="16" height="16" version="1.1" class="t3js-icon icon icon-size-small icon-state-default icon-apps-pagetree-folder-default" data-identifier="apps-pagetree-folder-default">
        <image xlink:href="t3-icons/apps-pagetree-folder-default.svg" width="16" height="16" />
    </svg>',
];
$iconCount = count($icons);

function fakeChildren($depth = 0) {
    $children = [];
    $max = rand(0, 9);
    for ($i = 0; $i < $max; $i++) {
        $children[] = fakeRecord($depth);
    }
    return $children;
}

function fakeRecord($depth = 0) {
    global $words, $wordsCount, $icons, $iconCount;
    $record = [
        'identifier' =>  str_replace('.', '', uniqid('', true)),
        'name' => $words[rand(0, $wordsCount - 1)],
        'icon' => $icons[rand(0, $iconCount - 1)],
        'checked' => rand(0, 1) === 1
    ];
    $depth--;
    if ($depth) {
        $record['children'] = fakeChildren($depth);
    }
    return $record;
}

header('Content-Type: application/json');
echo json_encode(fakeRecord(5));
