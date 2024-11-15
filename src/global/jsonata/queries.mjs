  /*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

          https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      R.Piontik <r.piontik@mail.ru>

  Contributors:
      R.Piontik <r.piontik@mail.ru>
  */

const QUERY_ID_USER_MENU = 'f3ee63af-bcd6-49bb-bc2a-a9849772e602';
const QUERY_ID_TECHNOLOGIES = 'acfb0fde-c328-4852-82e6-1d8bb24bedaa';
const QUERY_ID_TECHNOLOGY = '1aac84f9-369b-4c5e-883a-b1e4e0dfde7c';
const QUERY_ID_DOCUMENTS_FOR_ENTITY = 'f20896a6-dd0b-4977-81f0-a5f111253d0e';

const QUERY_ID_JSONSCEMA_ENTITIES = '2e38141a-100a-4331-bc80-5dd198acc8b8';

const QUERY_GET_OBJECT = '5786bdd1-07bd-4c6c-b1fb-d8efe2c7368f';

// First, define IDS
const IDS = {
    USER_MENU: QUERY_ID_USER_MENU,
    TECHNOLOGIES: QUERY_ID_TECHNOLOGIES,
    TECHNOLOGY: QUERY_ID_TECHNOLOGY,
    DOCUMENTS_FOR_ENTITY: QUERY_ID_DOCUMENTS_FOR_ENTITY,
    JSONSCEMA_ENTITIES: QUERY_ID_JSONSCEMA_ENTITIES,
    GET_OBJECT: QUERY_GET_OBJECT,
    GLOBAL_SEARCH: 'global.search',
    GLOBAL_SEARCH_WITH_CONTENT: 'global.search.with.content'
};

// Then define queries
const queries = {
    // Строит пользовательское меню
    [QUERY_ID_USER_MENU]: `
    (
        $isURL := $matcher := /^[a-zA-Z]*\\:.*$/i;
        $isRoot := $matcher := /^\\/.*$/i;
        $defOrder := 10000;
    
        $append((
            $GET_TITLE := function($LOCATION) {(
                $STRUCT := $split($LOCATION, "/");
                $STRUCT[$count($STRUCT) - 1];
            )};
        
            $MANIFEST := $;
            $append([
                    {
                        "title": 'Техрадар',
                        "location": 'Техрадар',
                        "route": 'techradar',
                        "icon": 'track_changes',
                        "order": $defOrder
                    },
                    technologies.sections.$spread().{
                        "title": $.*.title,
                        "route": 'techradar/' & $keys()[0],
                        "location": 'Техрадар/' & $.*.title,
                        "order": $defOrder
                    },
                    {
                        "title": 'Проблемы',
                        "location": 'Проблемы',
                        "route": 'problems',
                        "icon": 'report_problem',
                        "order": $defOrder
                    }
                ][($exists(hiden) and $not(hiden)) or $not($exists(hiden))],
                entities.*.(
                    $eval(menu, $MANIFEST).{
                        "route": link,
                        "location": location,
                        "icon": icon,
                        "title": $GET_TITLE(location),
                        "order": order ? order : $defOrder
                    }
                )
            )
        ).{
            "title": "" & title,
            "route": route ? (
                $isURL(route) ? route
                : ($isRoot(route) ? route : '/' & route)
            ) : undefined,
            "icon": icon,
            "location": "" & (location ? location : route),
            "order": order
        }^(order, location), [
            {
                "title": 'JSONata',
                "route": '/devtool',
                "icon": 'chrome_reader_mode',
                "location": "devtool",
                "order": $defOrder
            }
        ])
    )
    `,
    [QUERY_ID_TECHNOLOGIES] : `
    (
        $MANIFEST := $;
        $DOTS := $distinct($distinct(components.*.technologies).(
            $TECHKEY := $;
            $TECHNOLOGY := $lookup($MANIFEST.technologies.items, $type($)="string" ? $ : undefined);
            $TECHNOLOGY := $TECHNOLOGY ? $merge([$TECHNOLOGY, {"id": $TECHKEY}]) : $single(
                $spread(
                    $sift($MANIFEST.technologies.items, function($v, $k) {
                        [$TECHKEY in $v.aliases]}
                    )
                ), function($v, $k){ $k=0 }).$merge([$.*, {"id": $keys($)}]);
            $TECHNOLOGY := $TECHNOLOGY ? $TECHNOLOGY : {
                "id": $TECHKEY,
                "section": "UNKNOWN",
                "title": "Не определено"
            }; 
            $SECTION := $lookup($MANIFEST.technologies.sections, $TECHNOLOGY.section);
            {
                "label": $TECHNOLOGY.id,
                "key": $TECHNOLOGY.id,
                "hint": $TECHNOLOGY.title,
                "link": $TECHNOLOGY.link,
                "status": $TECHNOLOGY.status,
                "section" : {
                    "key": $TECHNOLOGY.section,
                    "title": $SECTION.title ? $SECTION.title : "Не определено"
                }
            }
        ));

        {
            "sections": $merge([$DOTS.section.({key: $})]),
            "dots": $DOTS
        }
    )
    `,
    [QUERY_ID_TECHNOLOGY] : `
    (
        $MANIFEST := $;
        $TECH_ID := '{%TECH_ID%}';
        $TECHNOLOGY := $lookup(technologies.items, $TECH_ID);
        $TECHNOLOGY := $TECHNOLOGY ? $TECHNOLOGY : technologies.items.*[$TECH_ID in aliases];
        $COMPONENTS := $distinct($append(
                $MANIFEST.components.*[$TECH_ID in technologies], 
                $TECHNOLOGY.aliases.(
                    $ALIAS := $;
                    $MANIFEST.components.*[$ALIAS in technologies];
                )
        ));
        $COMPONENTS := $filter($MANIFEST.components.$spread(), function($v) {
                $lookup($v, $v.$keys()[0]) in $COMPONENTS
        }).$spread().{
                "id": $keys()[0],
                "title": *.title,
                "entity": *.entity ? *.entity : "component",
                "contexts": [*.presentations.contexts.$spread().(
                    $CONTEXT := $lookup($MANIFEST.contexts, $);
                    {
                        "id": $,
                        "title": $CONTEXT.title ? $CONTEXT.title : $
                    }
                )],
                "technologies": [*.technologies]
            };
        $CONTEXTS := $distinct($COMPONENTS.contexts);
        {
            'title': $TECHNOLOGY.title,
            'link': $TECHNOLOGY.link,
            'aliases': $TECHNOLOGY.aliases,
            'components': $COMPONENTS,
            'contexts': $CONTEXTS
        }
    )
    `,
    [QUERY_ID_DOCUMENTS_FOR_ENTITY] : `
    (
        $ENTITY_ID := '{%ENTITY%}';
        $MANIFEST := $;
        [docs.$spread().(
            $LINK := "/docs/" & $keys()[0];
            $ENTITY_ID in *.subjects ?
            [$[$ENTITY_ID in *.subjects]
                {
                    "location": *.location,
                    "title": *.description,
                    "link": $LINK
                }] : undefined;
        )[location]^(location)];
    )
    `,
    [QUERY_ID_JSONSCEMA_ENTITIES] : `
    (
        $manifest := $;
        {
            "type": "object",
            "properties": $merge([
                $manifest.entities.$spread().({
                    $keys()[0]: $.*.schema
                })
            ]),
            "$defs": $merge([$manifest.entities.*.schema."$defs"])
        };
    )
    `,
    [QUERY_GET_OBJECT]: `
    (
        $self := {%OBJECT_ID%};
        $self."$constructor" ? $eval($self."$constructor") : $self;
    )
    `,
    [IDS.GLOBAL_SEARCH]: `
    (
        /* Get search text parameter */
        $SEARCH := '{%SEARCH_TEXT%}';
        $SEARCH_LOWER := $lowercase($SEARCH);

        /* Helper function for fuzzy matching */
        $fuzzyMatch := function($text) {
            $text ? $contains($lowercase($string($text)), $SEARCH_LOWER) : false
        };

        /* Search in components */
        $COMPONENTS := components ? (
            components.$spread().(
                $ID := $keys()[0];
                $COMP := $.*;
                $fuzzyMatch($ID) or $fuzzyMatch($COMP.title) ? {
                    "id": $ID,
                    "title": $COMP.title,
                    "entity": "component",
                    "link": "/architect/components/" & $ID
                }
            )
        ) : [];

        /* Search in aspects */
        $ASPECTS := aspects ? (
            aspects.$spread().(
                $ID := $keys()[0];
                $ASP := $.*;
                $fuzzyMatch($ID) or $fuzzyMatch($ASP.title) ? {
                    "id": $ID,
                    "title": $ASP.title,
                    "entity": "aspect",
                    "link": "/architect/aspects/" & $ID
                }
            )
        ) : [];

        /* Search in docs */
        $DOCS := docs ? (
            docs.$spread().(
                $ID := $keys()[0];
                $DOC := $.*;
                $CONTENT := $eval($read($DOC.source)); // Read markdown content
                (
                    $fuzzyMatch($ID) or 
                    $fuzzyMatch($DOC.location) or
                    $fuzzyMatch($DOC.description) or
                    $fuzzyMatch($CONTENT) or  // Search in markdown content
                    ($DOC.subjects ? $DOC.subjects.($fuzzyMatch($)) : false)
                ) ? [
                    {
                        "id": $ID,
                        "title": $DOC.description,
                        "entity": "document",
                        "link": "/docs/" & $ID,
                        "matchedInContent": $fuzzyMatch($CONTENT) // Flag if matched in content
                    }
                ] : []
            )
        ) : [];

        /* Combine results */
        $ALL_RESULTS := (
            $COMPONENTS_AND_ASPECTS := $append($COMPONENTS, $ASPECTS);
            $DOCS_ARRAY := $DOCS[0];
            $append($COMPONENTS_AND_ASPECTS, $DOCS_ARRAY)
        );

        /* Sort and return */
        $ALL_RESULTS ? $ALL_RESULTS^(id) : []
    )
    `,
    [IDS.GLOBAL_SEARCH_WITH_CONTENT]: `
    (
        /* Get search text parameter */
        $SEARCH := searchText;
        $SEARCH_LOWER := $lowercase($SEARCH);

        /* Search in components */
        $COMPONENTS := $each(components, function($value, $key) {
            $fuzzyMatch($key) or $fuzzyMatch($value.title) ? {
                "id": $key,
                "title": $value.title,
                "entity": "component",
                "link": "/architect/components/" & $key,
                "score": 5
            }
        });

        /* Search in aspects */
        $ASPECTS := $each(aspects, function($value, $key) {
            $fuzzyMatch($key) or $fuzzyMatch($value.title) ? {
                "id": $key,
                "title": $value.title,
                "entity": "aspect",
                "link": "/architect/aspects/" & $key,
                "score": 5
            }
        });

        /* Get content results */
        $CONTENT_RESULTS := contentResults;

        /* Combine and sort results */
        $ALL := [
            $COMPONENTS[],
            $ASPECTS[],
            $CONTENT_RESULTS[]
        ];

        /* Return sorted results or empty array */
        $ALL ? $sort($ALL, function($l, $r) {
            $r.score - $l.score
        }) : []
    )
    `
};

export default {
    IDS,
    QUERIES: queries,
    // Вставляет в запрос параметры
    makeQuery(query, params) {
        // eslint-disable-next-line no-useless-escape
        return query.replace(/.*(\{\%([A-Z|\_]*)\%\}).*/g, (p1, p2, p3) => {
            return `${p1.replace(eval(`/{%${p3}%}/g`), params[p3])}`;
        });
    }
};

