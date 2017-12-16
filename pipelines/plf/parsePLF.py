import csv

rows = []

with open('./encodedPLF2017-Nomenclature_MPA.csv', newline='') as csvFile:
    reader = csv.reader(csvFile, delimiter=';', quotechar='|')
    next(reader, None)

    for row in reader:
        rows.append('|'.join([row[1], row[2], row[4], row[6]]))

with open('./PLFNomenclature.txt', 'w+') as csvFile:
    for row in rows:
        csvFile.write('{0}\n'.format(row))
