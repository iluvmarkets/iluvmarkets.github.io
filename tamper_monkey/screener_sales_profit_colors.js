// ==UserScript==
// @name         Screener.in Conditional Formatting with QoQ and YoY Growth
// @namespace    http://tampermonkey.net/
// @version      2.9
// @description  Apply gradient colors to specified rows and add QoQ% and YoY% Growth rows on Screener.in, after page load
// @match        https://www.screener.in/company/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Function to apply gradient color based on values and add growth rows
    function applyConditionalFormatting(label, qoqGrowth = false, yoyGrowth = false) {
        // Locate the specified row, checking for both text and button elements
        const targetRow = Array.from(document.querySelectorAll('tr')).find(row =>
            row.querySelector('td.text')?.innerText.trim() === label ||
            row.querySelector(`button[onclick*="${label}"]`)
        );

        if (!targetRow) return; // Exit if the row isn't found

        // Get the cells for the specified row
        const valueCells = Array.from(targetRow.querySelectorAll('td:not(.text)'));
        const values = valueCells.map(cell => parseFloat(cell.innerText.replace(/,/g, '')) || 0);
        const maxValue = Math.max(...values);

        // Apply gradient to each cell based on its value
        valueCells.forEach((cell, index) => {
            const value = values[index];
            if (!isNaN(value)) {
                let greenIntensity = Math.floor(255 - (value / maxValue) * 155); // Light green to dark green
                cell.style.backgroundColor = `rgb(${greenIntensity}, 255, ${greenIntensity})`;
            }
        });

        // Add QoQ growth row if specified
        if (qoqGrowth) {
            const qoqRow = document.createElement('tr');

            // Create a cell for the title "QoQ% Growth"
            const titleCell = document.createElement('td');
            titleCell.innerText = "QoQ% Growth";
            qoqRow.appendChild(titleCell);

            // Create empty cell for alignment in the first column
            const emptyCell = document.createElement('td');
            qoqRow.appendChild(emptyCell);

            const qoqGrowthValues = [];

            for (let i = 1; i < values.length; i++) {
                const growthCell = document.createElement('td');
                const qoqGrowthValue = ((values[i] - values[i - 1]) / values[i - 1]) * 100;
                growthCell.innerText = isNaN(qoqGrowthValue) ? "N/A" : qoqGrowthValue.toFixed(2) + '%';
                qoqGrowthValues.push(qoqGrowthValue);
                applyColoring(growthCell, qoqGrowthValue); // Apply color based on growth value

                // Append the growth cell to the new row
                qoqRow.appendChild(growthCell);
            }

            // Append the QoQ growth row after the target row
            targetRow.parentNode.insertBefore(qoqRow, targetRow.nextSibling);
        }

        // Add YoY growth row if specified
        if (yoyGrowth) {
            const yoyRow = document.createElement('tr');

            // Create a cell for the title "YoY% Growth"
            const yoyTitleCell = document.createElement('td');
            yoyTitleCell.innerText = "YoY% Growth";
            yoyRow.appendChild(yoyTitleCell);

            // Create empty cells for alignment in the first three columns
            for (let i = 0; i < 4; i++) {
                const emptyCell = document.createElement('td');
                yoyRow.appendChild(emptyCell);
            }

            const yoyGrowthValues = [];

            for (let i = 4; i < values.length; i++) {
                const growthCell = document.createElement('td');
                const yoyGrowthValue = ((values[i] - values[i - 4]) / values[i - 4]) * 100;
                growthCell.innerText = isNaN(yoyGrowthValue) ? "N/A" : yoyGrowthValue.toFixed(2) + '%';
                yoyGrowthValues.push(yoyGrowthValue);
                applyColoring(growthCell, yoyGrowthValue); // Apply color based on growth value

                // Append the growth cell to the new row
                yoyRow.appendChild(growthCell);
            }

            // Append the YoY growth row after the QoQ growth row
            targetRow.parentNode.insertBefore(yoyRow, targetRow.nextSibling);
        }
    }

    // Function to apply color based on growth values
    function applyColoring(cell, value) {
        if (value > 0) {
            // Positive growth - strong green background
            let greenIntensity = Math.floor(200 - (value / 100) * 150); // Change based on your max growth expectation
            cell.style.backgroundColor = `rgb(0, ${greenIntensity}, 0, 0.7)`; // Strong green
            cell.style.color = 'white'; // Text color for better readability
        } else if (value < 0) {
            // Negative growth - strong red background
            let redIntensity = Math.floor(200 + (value / 100) * 200); // Adjust the intensity
            cell.style.backgroundColor = `rgb(${redIntensity}, 0, 0, 0.7)`; // Strong red
            cell.style.color = 'white'; // Text color for better readability
        } else {
            // Zero growth - no background color
            cell.style.backgroundColor = '';
        }
    }

    applyConditionalFormatting("Revenue", true, true);
    applyConditionalFormatting("Sales", true, true);
    applyConditionalFormatting("Net Profit", true, true);
})();
