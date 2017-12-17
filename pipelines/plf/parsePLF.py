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
                        '|'.join([mission_type[key]] + [row[i] for i in file_type[t][:-1]]) + \
                        ';{}'.format(re.sub(' ', '', row[file_type[t][-1]]))
                    )

with open('./PLF.txt', 'w+') as csvFile:
    for row in rows:
        csvFile.write('{0}\n'.format(row))
