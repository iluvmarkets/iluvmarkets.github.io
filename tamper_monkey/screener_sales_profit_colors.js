// ==UserScript==
// @name         Screener.in Conditional Formatting with QoQ and YoY Growth
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Apply gradient colors to specified rows and add QoQ% and YoY% Growth rows on Screener.in, after page load
// @match        https://www.screener.in/company/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Function to apply gradient color based on values and add growth rows
    function applyConditionalFormatting(label, qoqGrowth = false, yoyGrowth = false) {
        const targetRow = Array.from(document.querySelectorAll('tr')).find(row =>
            row.querySelector('td.text')?.innerText.trim() === label ||
            row.querySelector(`button[onclick*="${label}"]`)
        );

        if (!targetRow) return; // Exit if the row isn't found

        const valueCells = Array.from(targetRow.querySelectorAll('td:not(.text)'));
        const values = valueCells.map(cell => parseFloat(cell.innerText.replace(/,/g, '')) || 0);

        // Apply gradient to each cell based on its value
        applyGradientColors(valueCells, values);

        // Add QoQ growth row if specified
        if (qoqGrowth) {
            const qoqRow = document.createElement('tr');
            const titleCell = document.createElement('td');
            titleCell.innerText = "QoQ% Growth";
            qoqRow.appendChild(titleCell);
            qoqRow.appendChild(document.createElement('td')); // Empty cell for alignment

            const qoqGrowthValues = [0];
            for (let i = 1; i < values.length; i++) {
                const previousValue = values[i - 1];
                const currentValue = values[i];
                const qoqGrowthValue = previousValue !== 0 ? ((currentValue - previousValue) / Math.abs(previousValue)) * 100 : (currentValue > 0 ? 100 : -100);
                qoqGrowthValues.push(qoqGrowthValue);
                const growthCell = document.createElement('td');
                growthCell.innerText = isNaN(qoqGrowthValue) ? "N/A" : qoqGrowthValue.toFixed(2) + '%';
                //applyColoring(growthCell, qoqGrowthValue);
                qoqRow.appendChild(growthCell);
            }
            applyGradientColors(qoqRow.querySelectorAll('td:not(:first-child)'), qoqGrowthValues);
            targetRow.parentNode.insertBefore(qoqRow, targetRow.nextSibling);
        }

        // Add YoY growth row if specified
        if (yoyGrowth) {
            const yoyRow = document.createElement('tr');
            const yoyTitleCell = document.createElement('td');
            yoyTitleCell.innerText = "YoY% Growth";
            yoyRow.appendChild(yoyTitleCell);
            for (let i = 0; i < 4; i++) {
                yoyRow.appendChild(document.createElement('td')); // Empty cells for alignment
            }

            const yoyGrowthValues = [0,0,0,0];
            for (let i = 4; i < values.length; i++) {
                const previousValue = values[i - 4];
                const currentValue = values[i];
                const yoyGrowthValue = previousValue !== 0 ? ((currentValue - previousValue) / Math.abs(previousValue)) * 100 : (currentValue > 0 ? 100 : -100);
                yoyGrowthValues.push(yoyGrowthValue);
                const growthCell = document.createElement('td');
                growthCell.innerText = isNaN(yoyGrowthValue) ? "N/A" : yoyGrowthValue.toFixed(2) + '%';
                //applyColoring(growthCell, yoyGrowthValue);
                yoyRow.appendChild(growthCell);
            }
            applyGradientColors(yoyRow.querySelectorAll('td:not(:first-child)'), yoyGrowthValues);
            targetRow.parentNode.insertBefore(yoyRow, targetRow.nextSibling);
        }
    }

    // Function to apply gradient colors based on value arrays
    function applyGradientColors(cells, values) {
        //const maxValue = Math.max(...values.map(Math.abs));
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);

        cells.forEach((cell, index) => {
            const value = values[index];
            console.log(value);
            if (Number.isFinite(value)) {
                if (value > 0) {
                    // Positive values - apply green gradient
                    let greenIntensity = Math.floor(155 + (value / maxValue * 100));
                    cell.style.backgroundColor = `rgb(25, ${greenIntensity},25,0.7)`;
                } else if (value < 0) {
                    // Negative values - apply red gradient
                    let redIntensity = Math.floor(155 + (value / minValue * 100));
                    cell.style.backgroundColor = `rgb(${redIntensity}, 25,25,0.7`;
                }
            }
        });
    }

    // Function to apply color based on growth values
    function applyColoring(cell, value) {
        if (value > 0) {
            // Positive growth - strong green background
            let greenIntensity = Math.floor(200 - (value / 100) * 150);
            cell.style.backgroundColor = `rgb(0, ${greenIntensity}, 0, 0.7)`; // Strong green
            cell.style.color = 'white'; // Text color for better readability
        } else if (value < 0) {
            // Negative growth - strong red background
            let redIntensity = Math.min(255, Math.abs(Math.floor(200 + (value / 100) * 200)));
            cell.style.backgroundColor = `rgba(${redIntensity}, 0, 0, 0.7)`; // Strong red
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
