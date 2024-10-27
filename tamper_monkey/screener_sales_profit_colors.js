// ==UserScript==
// @name         Screener.in Conditional Formatting with QoQ and YoY Growth
// @namespace    http://tampermonkey.net/
// @version      3.1
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

    function calculatePercentageFromHigh() {
        // Define the container with class .company-ratios to scope the search
        const container = document.querySelector("div.company-ratios");

        if (!container) {
            console.error("Container not found");
            return;
        }

        let currentPrice = null;
        let highValue = null;
        let currentPriceItem = null;

        // Select all <li> elements within the container
        const listItems = container.querySelectorAll("li");

        // Loop through the <li> elements to find "Current Price" and "High / Low"
        listItems.forEach(item => {
            const nameElement = item.querySelector(".name");

            if (nameElement && nameElement.textContent.trim() === "Current Price") {
                // Extract the current price value
                currentPrice = parseFloat(item.querySelector(".number").textContent.replace(/[^0-9.-]/g, ""));
                currentPriceItem = item;  // Store the current price item to insert the new item after it
            }

            if (nameElement && nameElement.textContent.trim() === "High / Low") {
                // Extract the high value from the "High / Low" <li>
                highValue = parseFloat(item.querySelectorAll(".number")[0].textContent.replace(/[^0-9.-]/g, ""));
            }
        });

        if (currentPrice !== null && highValue !== null && currentPriceItem) {
            // Calculate the percentage from high
            const percentFromHigh = ((currentPrice - highValue) / highValue) * 100;

            // Create a new <li> element to display the result
            const newListItem = document.createElement("li");
            newListItem.className = "flex flex-space-between";
            newListItem.innerHTML = `
            <span class="name">% from High</span>
            <span class="nowrap value"><span class="number">${percentFromHigh.toFixed(2)}%</span></span>
        `;

            // Insert the new <li> element right after the "Current Price" item
            currentPriceItem.insertAdjacentElement('afterend', newListItem);
        } else {
            console.error("Current Price or High Value not found in the HTML");
        }
    }



    applyConditionalFormatting("Revenue", true, true);
    applyConditionalFormatting("Sales", true, true);
    applyConditionalFormatting("Net Profit", true, true);

    //Calculate distance from HIGH
    calculatePercentageFromHigh();

})();
