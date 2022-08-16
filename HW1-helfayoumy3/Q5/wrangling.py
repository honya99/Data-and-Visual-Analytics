""" wrangling.py - utilities to supply data to the templates.

This file contains a pair of functions for retrieving and manipulating data
that will be supplied to the template for generating the table."""
import csv

def username():
    return 'helfayoumy3'

def data_wrangling():
    with open('data/movies.csv', 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        table = list()
        # Feel free to add any additional variables

        # Read in the header
        for header in reader:
            break
        
        # Read in each row
        for i, row in enumerate(reader):
            if(i <= 100):
                table.append(row)
                table[i][2] = float(table[i][2])
            # Only read first 100 data rows - [2 points] Q5.a

        sortLastColumn = sorted(table, key=lambda x: x[2], reverse=True)    
        # Order table by the last column - [3 points] Q5.b
    
    return header, sortLastColumn

