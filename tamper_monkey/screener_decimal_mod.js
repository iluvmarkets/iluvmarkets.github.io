// ==UserScript==
// @name         iLuvMarkets Screener.in ModbyExploringStocks
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  Apply conditional formatting and QoQ growth calculations for Screener.in pages
// @match        https://www.screener.in/company/*
// @match        https://www.screener.in/results/latest/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Function for applying conditional formatting and growth calculations
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
                growthCell.innerHTML = isNaN(qoqGrowthValue) ? "N/A" : (qoqGrowthValue > 0 ? `<span class="change up">⇡ ${qoqGrowthValue.toFixed(0)}%</span>` : `<span class="change down">⇣ ${Math.abs(qoqGrowthValue).toFixed(0)}%</span>`);
                qoqRow.appendChild(growthCell);
            }
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

            const yoyGrowthValues = [0, 0, 0, 0];
            for (let i = 4; i < values.length; i++) {
                const previousValue = values[i - 4];
                const currentValue = values[i];
                const yoyGrowthValue = previousValue !== 0 ? ((currentValue - previousValue) / Math.abs(previousValue)) * 100 : (currentValue > 0 ? 100 : -100);
                yoyGrowthValues.push(yoyGrowthValue);
                const growthCell = document.createElement('td');
                growthCell.innerHTML = isNaN(yoyGrowthValue) ? "N/A" : (yoyGrowthValue > 0 ? `<span class="change up">⇡ ${yoyGrowthValue.toFixed(0)}%</span>` : `<span class="change down">⇣ ${Math.abs(yoyGrowthValue).toFixed(0)}%</span>`);
                yoyRow.appendChild(growthCell);
            }
            targetRow.parentNode.insertBefore(yoyRow, targetRow.nextSibling);
        }
    }

    // Function to apply gradient colors based on value arrays
    function applyGradientColors(cells, values) {
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);

        cells.forEach((cell, index) => {
            const value = values[index];
            if (Number.isFinite(value)) {
                // Removed the color background as requested
            }
        });
    }

    function calculatePercentageFromHigh() {
        const container = document.querySelector("div.company-ratios");

        if (!container) {
            console.error("Container not found");
            return;
        }

        let currentPrice = null;
        let highValue = null;
        let currentPriceItem = null;

        const listItems = container.querySelectorAll("li");

        listItems.forEach(item => {
            const nameElement = item.querySelector(".name");

            if (nameElement && nameElement.textContent.trim() === "Current Price") {
                currentPrice = parseFloat(item.querySelector(".number").textContent.replace(/[^0-9.-]/g, ""));
                currentPriceItem = item;
            }

            if (nameElement && nameElement.textContent.trim() === "High / Low") {
                highValue = parseFloat(item.querySelectorAll(".number")[0].textContent.replace(/[^0-9.-]/g, ""));
            }
        });

        if (currentPrice !== null && highValue !== null && currentPriceItem) {
            const percentFromHigh = ((currentPrice - highValue) / highValue) * 100;

            const newListItem = document.createElement("li");
            newListItem.className = "flex flex-space-between";
            newListItem.innerHTML = `
            <span class="name">% from High</span>
            <span class="nowrap value"><span class="number">${percentFromHigh.toFixed(2)}%</span></span>
        `;

            currentPriceItem.insertAdjacentElement('afterend', newListItem);
        } else {
            console.error("Current Price or High Value not found in the HTML");
        }
    }

    // Helper function to parse numbers from text
    function parseNumber(text) {
        return parseFloat(text.replace(/[₹,]/g, '').trim());
    }

    // Helper function to calculate rounded percentage change
    function calculateQoQ(current, previous) {
        if (previous === 0) return null; // Avoid division by zero
        const qoQValue = Math.round(((current - previous) / Math.abs(previous)) * 100);
        return isNaN(qoQValue) ? null : qoQValue;
    }

    // Main function to insert QoQ column
    function insertQoQColumn() {
        // Select the table containing the results
        const tables = document.querySelectorAll('.data-table');

        tables.forEach(table => {
            const headerRow = table.querySelector('thead tr');
            const rows = table.querySelectorAll('tbody tr');

            // Insert "QoQ" column in the header row
            const qoQHeader = document.createElement('th');
            qoQHeader.textContent = 'QoQ';
            headerRow.insertBefore(qoQHeader, headerRow.children[2]); // Insert after YOY column

            // Iterate over each row to calculate QoQ change
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > 3) {
                    // Get values from the third-last (current quarter) and second-last (previous quarter) columns
                    const currentQuarter = parseNumber(cells[cells.length - 3].textContent);
                    const previousQuarter = parseNumber(cells[cells.length - 2].textContent);

                    // Calculate QoQ percentage change (rounded) and insert it in the new cell
                    const qoQValue = calculateQoQ(currentQuarter, previousQuarter);
                    const qoQCell = document.createElement('td');

                    if (qoQValue !== null) {
                        qoQCell.innerHTML = qoQValue >= 0
                            ? `<span class="change up">⇡ ${qoQValue}%</span>`
                            : `<span class="change down">⇣ ${Math.abs(qoQValue)}%</span>`;
                    } else {
                        qoQCell.textContent = ''; // Leave blank if NaN
                    }

                    row.insertBefore(qoQCell, cells[2]); // Insert after YOY column
                }
            });
        });
    }

    // Check the URL to determine which function to run
    const currentUrl = window.location.href;
    if (currentUrl.includes("company")) {
        // Apply formatting for specified financial metrics
        applyConditionalFormatting("Revenue", true, true);
        applyConditionalFormatting("Sales", true, true);
        applyConditionalFormatting("Net Profit", true, true);
        applyConditionalFormatting("EPS in Rs", true, true); // Added this line for "EPS in Rs"
        // Calculate distance from HIGH
        calculatePercentageFromHigh();
    } else if (currentUrl.includes("results/latest")) {
        // Wait for the page content to load and then run the function
        window.addEventListener('load', () => {
            setTimeout(insertQoQColumn, 1); 

        });
    }

})();
