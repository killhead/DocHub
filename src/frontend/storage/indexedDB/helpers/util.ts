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

  */


import { TIndexes } from '../types/idb.types';

export const iDbIndexesIsEqual = (
  indexNames: DOMStringList,
  indexes: TIndexes[]
): boolean => {
  const existIndexes = Object.values(indexNames);
  return (indexes.length === existIndexes.length) && !indexes.filter(
    (index: TIndexes): boolean => !existIndexes.includes(index.name)
  ).length;
};