import csv
import os
import re

rows = []
rawFilesPath = './rawData'
decodedFilesPath = './decoded'

if not os.path.exists(decodedFilesPath):
    os.makedirs(decodedFilesPath)

# Encode CSV files in UTF-8
for fileName in os.listdir(rawFilesPath):
    os.system('iconv -f ISO-8859-1 -t UTF-8 {} > {}'.format(os.path.join(rawFilesPath, fileName), os.path.join(decodedFilesPath, fileName)))

mission_type = {
    'BG': 'Budget Général',
    'CF': 'Concours Financiers',
    'CS': 'Comptes Spéciaux',
    'BA': 'Budgets Annexes',
}

file_type = {
    'Dest': [0, 1, 2, 5, 9],
    'Nat': [0, 1, 2, 4, 8],
}

programIdMap = {}

with open(os.path.join(decodedFilesPath, 'PLF2017-Nomenclature_MPA.csv')) as csvFile:
    reader = csv.reader(csvFile, delimiter=';')
    next(reader, None)

    for row in reader:
        programCode = int(row[3])
        program = row[4]
        actionCode = int(row[5])
        action = row[6]

        if programCode in programIdMap:
            programIdMap[programCode]['actions'][actionCode] = action
        else:
            programIdMap[programCode] = {
                'program': program,
                'actions': {
                    actionCode: action,
                }
            }

def rowParser(row, indices, programIdMap):
    columns = [row[i] for i in indices[:-1]]
    programCode = int(columns[1])
    actionCode = int(columns[2])

    if programCode in programIdMap:
        columns[1] = programIdMap[programCode]['program']
        if actionCode in programIdMap[programCode]['actions']:
            columns[2] = programIdMap[programCode]['actions'][actionCode]
        else:
            print('actionCode error: {} {}'.format(columns[1], columns[2]))
            # print('action dict: {}'.format(str(programIdMap[programCode]['actions'])))
    else:
        print('programCode error: {}'.format(columns[1]))

    # columns = list(filter(lambda x: x != '', columns))

    return columns

for t in file_type:
    for key in mission_type:
        path = '{}/PLF2017-{}-Msn-{}.csv'.format(decodedFilesPath, key, t)
        if os.path.exists(path):
            with open(path, newline='') as csvFile:
                reader = csv.reader(csvFile, delimiter=';')
                for _ in range(4):
                    next(reader, None)

                for row in reader:
                    rows.append(
                        '|'.join([mission_type[key]] + rowParser(row, file_type[t], programIdMap)) + \
                        ';{}'.format(re.sub(' ', '', row[file_type[t][-1]]))
                    )

with open('./PLF.txt', 'w+') as csvFile:
    for row in rows:
        csvFile.write('{0}\n'.format(row))
