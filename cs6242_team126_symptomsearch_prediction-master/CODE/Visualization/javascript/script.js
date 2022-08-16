// enter code to define margin and dimensions
const margin = {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
    },
    width = 1500 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

// Define tip for hover over the choropleth
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-5, 0]);

// Define svg for the choropleth
var svg = d3.select("#choropleth").append("svg")
    .attr("height", height)
    .attr("width", width)
    .call(tip);

// Define svg with height and width for bar graph
const bar_graph_width = 600;
const bar_graph_height = 400;
var svg_bar_chart = d3.select("#bargraph").append("svg")
    .attr("width", bar_graph_width + margin.left + margin.right)
    .attr("height", bar_graph_height + margin.top + margin.bottom);

// Define svg with height and width for line graph
const line_graph_width = 600;
const line_graph_height = 400;
var svg_line_chart = d3.select("#linechart").append("svg")
    .attr("width", line_graph_width + margin.left + margin.right)
    .attr("height", line_graph_height + margin.top + margin.bottom);

// Define color scheme for the choropleth
var colorScale = d => d3.interpolateRdYlGn(d);
var color = d3.scaleSequential(colorScale);

// Define projection and path required for Choropleth
var path = d3.geoPath();

// Define variables for storing data, selected symptom, and selected training
// model
var mapOfCounties = [];
var model_output = [];
var predict_output = [];
var selected_symptom;
var selected_model = 'symptom_search'; // Default training model

// CSV files to load
const error_result_set = 'data/Error_Output_All.csv';
const prediction_result_set = 'data/Model_Predictions_All.csv';
const county_json = 'data/counties-albers-10m.json';

/**
 * Load the files: county data for the choropleth, result set for the symptom
 * and county, and actual and predicted value set for a time period.
 */
Promise.all([
    // Loading the Json
    d3.json(county_json),

    // Load rmse and mape result for different symptoms
    d3.dsv(",", error_result_set, function (d) {
        return {
            group: d.Model_Group_Number,
            symptom: d.Target_Variable,
            state: d.State,
            county: d.County,
            fips: parseInt(d['FIPS']),
            mape_search_and_temp: d['MAPE: Search and Temp'] === 'NA' ?
                parseFloat("-1") : parseFloat(d['MAPE: Search and Temp']),
            mape_search: d['MAPE: Search Only'] === 'NA' ?
                parseFloat("-1") : parseFloat(d['MAPE: Search Only']),
            mape_temp: d['MAPE: Temp'] === 'NA' ?
                parseFloat("-1") : parseFloat(d['MAPE: Temp']),
            rmse_search_and_temp: d['RMSE: Search and Temp'] === 'NA' ?
                parseFloat("-1") : parseFloat(d['RMSE: Search and Temp']),
            rmse_search: d['RMSE: Search Only'] === 'NA' ?
                parseFloat("-1") : parseFloat(d['RMSE: Search Only']),
            rmse_temp: d['RMSE: Temp'] === 'NA' ?
                parseFloat("-1") : parseFloat(d['RMSE: Temp']),
        }
    }),

    // Load the actual and predicted values over a time period
    d3.dsv(",", prediction_result_set, function (d) {
        return {
            group: d.Model_Group_Number,
            date: d.date,
            symptom: d.Target_Variable,
            state: d.State,
            county: d.County,
            fips: parseInt(d['FIPS']),
            actual_value: d['Actual Value'] === 'NA' ?
                parseFloat("-1") : parseFloat(d['Actual Value']),
            predict_search: d['Prediction: Search Only'] === 'NA' ?
                parseFloat("-1") : parseFloat(d['Prediction: Search Only']),
            predict_temp: d['Prediction: Temperature'] === 'NA' ?
                parseFloat("-1") : parseFloat(d['Prediction: Temperature']),
            predict_search_temp: d['Prediction: Search and Temp'] === 'NA' ?
                parseFloat("-1") : parseFloat(d['Prediction: Search and Temp']),
        }
    })
]).then(function (data) {
    mapOfCounties = data[0];
    model_output = data[1];
    predict_output = data[2];
    // Draw choropleth and other details for the result sets
    ready(mapOfCounties, model_output)
}).catch(function (error) {
    console.log(error);
});

/**
 * Get the symptom list from the input data and draw the choropleth with default
 * values for the symptom and training model
 *
 * @param mapOfCounties county data for the choropleth
 * @param model_output specified result set for symptoms and countied
 */
function ready(mapOfCounties, model_output) {
    // Get the unique list of Symptoms
    var symptomOptions = d3.map(model_output, function (d) {
        return d.symptom;
    }).keys().sort();

    // Set the dropdown options for symptom selector
    d3.select("#symptom").selectAll("option")
        .data(symptomOptions)
        .enter()
        .append("option")
        .text(function (d) {
            return d;
        });
    // Set the first symptom in the list as the default selected symptom
    selected_symptom = symptomOptions[0];

    // create Choropleth with default option.
    mapUpdater(mapOfCounties, model_output, selected_symptom, selected_model);
}


// event listener for the dropdown. Update choropleth and legend when
// selection changes. Call createMapAndLegend() with required arguments.
/**
 * This function is called on change event for the symptom, and training model
 * dropdown. It will update the choropleth for the selected symptom, and
 * training model with RMSE value for available counties.
 */
function updateMap() {
    // Get the selected symptom
    selected_symptom = d3.select("#symptom_options")
        .select("select")
        .property("value");
    // Get the selected training model
    selected_model = d3.select("#model_options")
        .select("select")
        .property("value");
    // Plot the details
    mapUpdater(mapOfCounties, model_output, selected_symptom, selected_model);
}

/**
 * Return RMSE value for the selected model and specified county data.
 *
 * @param selected_model specified training model
 * @param county_data specified county data
 * @returns rmse value for the specified model and county data
 */
function getRMSE(selected_model, county_data) {
    var rmse;
    if (selected_model.toLowerCase() === 'symptom_search') {
        rmse = county_data.rmse_search;
    } else if (selected_model.toLowerCase() === 'weather_search') {
        rmse = county_data.rmse_temp;
    } else if (selected_model.toLowerCase() === 'weather_symptom_search') {
        rmse = county_data.rmse_search_and_temp;
    }
    return rmse;
}

/**
 * This function will remove the previous bar and line graphs.
 */
function removeLineAndBarGraphs() {
    svg_bar_chart.selectAll('*').remove();
    svg_line_chart.selectAll('*').remove();
}

/**
 * This function will update the choropleth for the selected symptom, and
 * training model with RMSE value for available counties. On mouseover of the
 * county it will show the additional details (county, state, training model,
 * symptom, rmse, and mape values) for this county. On double click on a certain
 * county, this function will create the line chart for comparison between the
 * actual value and ARIMA predicted values for different values over a period of
 * 3 months for the selected symptom. It will also draw the bar graph to compare
 * the RMSE values for the three models for the selected symptom.
 *
 * @param mapOfCounties county data for the choropleth.
 * @param model_output result set for all symptoms, and counties for all models.
 * @param selected_symptom selected symptom for analysis
 * @param selected_model selected training model for analysis
 */
function mapUpdater(mapOfCounties,
                    model_output,
                    selected_symptom,
                    selected_model) {
    // Remove the previous bar chart and line chart
    removeLineAndBarGraphs();

    // Define domain for the color scheme, and get the filtered result set for
    // the selected symptom
    var color_domain = [];
    var county_map = new Map();
    model_output.filter(function (d) {
        return d.symptom.toLowerCase() === selected_symptom.toLowerCase();
    }).forEach(function (d) {
        if (selected_model.toLowerCase() ===
            'symptom_search'.toLowerCase()) {
            color_domain.push(d.rmse_search);
        } else if (selected_model.toLowerCase() ===
            'weather_search'.toLowerCase()) {
            color_domain.push(d.rmse_temp);
        } else if (selected_model.toLowerCase() ===
            'weather_symptom_search'.toLowerCase()) {
            color_domain.push(d.rmse_search_and_temp);
        }
        // Manipulating fips code to match the fips between result set and
        // county data
        var fips_code = d.fips.toString().length < 5 ?
            '0' + d.fips.toString() : d.fips.toString();
        county_map[fips_code] = d;
    });
    color.domain([0, d3.max(color_domain)]);

    // Draw the choropleth
    svg.append("g")
        .selectAll("path")
        .data(topojson.feature(mapOfCounties,
            mapOfCounties.objects.counties).features)
        .enter()
        .append("path")
        .attr("stroke-width", "0.5px")
        .attr("stroke", "#fff")
        .attr("d", path)
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)
        .on('dblclick', function (d) {
            removeLineAndBarGraphs();
            if (d.properties.allow_click === "false") {
                return;
            }
            // Create the line chart and bar graph on double click event
            linechart_draw(county_map[d.id]);
            barchart_draw(county_map[d.id]);
        })
        .attr("fill", function (d) {
            if (county_map[d.id] !== undefined) {
                var rmse = getRMSE(selected_model, county_map[d.id]);
                if (rmse === -1) {
                    // Default color for counties with unavailable data
                    d.properties.allow_click = "false";
                    return "#eee";
                }
                d.properties.allow_click = "true";
                return color(rmse);
            } else {
                d.properties.allow_click = "false";
                // Default color for counties with insufficient data
                return "#eee";
            }
        });

    // Add tip details for onmouseover event
    tip.html(function (d) {
        // Get the details for hover card
        var data = county_map[d.id] !== undefined ?
            county_map[d.id] : new Object();
        var county_mape;
        var county_rmse;
        if (selected_model.toLowerCase() === 'symptom_search') {
            county_mape = data.mape_search;
            county_rmse = data.rmse_search;
        } else if (selected_model.toLowerCase() === 'weather_search') {
            county_mape = data.mape_temp;
            county_rmse = data.rmse_temp;
        } else if (selected_model.toLowerCase() === 'weather_symptom_search') {
            county_mape = data.mape_search_and_temp;
            county_rmse = data.rmse_search_and_temp;
        }
        // Show default message for the case where insufficient data is
        // available for the county
        if (county_map[d.id] === undefined || county_rmse === -1) {
            var content = '<div class="card"><div class="container">' +
                'Insufficient Data for the selected county</div></div>';
            return content;
        }
        // Create the html
        var content = '<div class="card"><div class="container">' +
            '<table style="{margin-top: 2.5px;}">' +
            '<tr><td>Symptom:</td><td>' + data.symptom + '</td></tr>' +
            '<tr><td>County:</td><td>' + data.county + '</td></tr>' +
            '<tr><td>State:</td><td>' + data.state + '</td></tr>' +
            '<tr><td>RMSE:</td><td>' + county_rmse + '</td></tr>' +
            '<tr><td>MAPE:</td><td>' + county_mape * 100 + ' %</td></tr>' +
            '</table></div></div>';
        return content;
    });

    // Add the color legend for the choropleth
    svg.selectAll(".legend").remove();
    var legend = svg.selectAll(".legend")
        .data(color.ticks(10).slice(1))
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) {
            return "translate(" + (width - 500) + "," +
                (height - margin.top - i * 20) + ")";
        });
    legend.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", color);
    legend.append("text")
        .attr("x", 26)
        .attr("y", 10)
        .attr("dy", ".35em")
        .text(d3.format(".2f"));
}

/**
 * Draws the line charts for comparison between the actual search values and the
 * ARIMA predicted values for different training model for the specified county
 * for the selected medical symptom. Both the result sets (time series data, and
 * error result set for different models) has already been grouped by a system
 * generated unique identifier. We are using this unique identifier to get the
 * time series data for the specified county.
 *
 * @param county_data specified county data to draw the line chart
 */
function linechart_draw(county_data) {
    // Do not do anything if the specified county data is undefined.
    if (county_data === undefined) {
        return;
    }
    // Filter the time series data by unique identifier to get the values for
    // the specified county only.
    var filtered_predict_output = predict_output.filter(function (d) {
        return d.group === county_data.group && d.fips === county_data.fips;
    });

    const has_search_predict =
        filtered_predict_output[0].predict_search === -1 ? false : true;
    const has_temp_predict =
        filtered_predict_output[0].predict_temp === -1 ? false : true;
    const has_search_temp_predict =
        filtered_predict_output[0].predict_search_temp === -1 ? false : true;

    // Nesting the data to draw line graphs.
    var nested_predict_output = d3.nest()
        .key(function (d) {
            return d.group;
        })
        .entries(filtered_predict_output);

    // create scale for X axis and set its range and domain
    var x = d3.scaleTime()
        .range([margin.left, line_graph_width - margin.right])
        .domain(d3.extent(filtered_predict_output, function (d) {
            return new Date(d.date);
        }));

    var y = d3.scaleLinear()
        .range([line_graph_height - margin.bottom, margin.top])
        .domain([0, d3.max(filtered_predict_output, function (d) {
            return Math.max(d.actual_value,
                d.predict_search,
                d.predict_temp,
                d.predict_search_temp);
        })]);

    // define the axes
    var xAxis = d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%m/%d/%y"));
    var yAxis = d3.axisLeft(y);

    // Create the line grah for the actual search values
    svg_line_chart.selectAll(".line")
        .data(nested_predict_output)
        .enter()
        .append("path")
        .attr("d", function (d) {
            return d3.line().x(function (d) {
                return x(new Date(d.date));
            }).y(function (d) {
                return y(d.actual_value);
            })
            (d.values)
        })
        .attr("stroke", function (d) {
            return "#4285f4";
        })
        .attr("fill", "none");

    nested_predict_output.forEach(function (d) {
        d.values.forEach(function (v) {
            svg_line_chart.append("circle")
                .attr("fill", "#4285f4")
                .attr("stroke", "#4285f4")
                .attr("cx", function () {
                    return x(new Date(v.date));
                })
                .attr("cy", function () {
                    return y(v.actual_value);
                })
                .attr("r", 2);
        });
    });


    // Create line graph for ARIMA predicted values using search trends.
    if (has_search_predict) {
        svg_line_chart.selectAll(".line")
            .data(nested_predict_output)
            .enter()
            .append("path")
            .attr("d", function (d) {
                return d3.line().x(function (d) {
                    return x(new Date(d.date));
                }).y(function (d) {
                    return y(d.predict_search);
                })
                (d.values)
            })
            .attr("stroke", function (d) {
                return "#db4437";
            })
            .attr("fill", "none");

        nested_predict_output.forEach(function (d) {
            d.values.forEach(function (v) {
                svg_line_chart.append("circle")
                    .attr("fill", "#db4437")
                    .attr("stroke", "#db4437")
                    .attr("cx", function () {
                        return x(new Date(v.date));
                    })
                    .attr("cy", function () {
                        return y(v.predict_search);
                    })
                    .attr("r", 2);
            });
        });
    }

    // Create line graph for ARIMA predicted values using weather metric.
    if (has_temp_predict) {
        svg_line_chart.selectAll(".line")
            .data(nested_predict_output)
            .enter()
            .append("path")
            .attr("d", function (d) {
                return d3.line().x(function (d) {
                    return x(new Date(d.date));
                }).y(function (d) {
                    return y(d.predict_temp);
                })
                (d.values)
            })
            .attr("stroke", function (d) {
                return "#f4b400";
            })
            .attr("fill", "none");

        nested_predict_output.forEach(function (d) {
            d.values.forEach(function (v) {
                svg_line_chart.append("circle")
                    .attr("fill", "#f4b400")
                    .attr("stroke", "#f4b400")
                    .attr("cx", function () {
                        return x(new Date(v.date));
                    })
                    .attr("cy", function () {
                        return y(v.predict_temp);
                    })
                    .attr("r", 2);
            });
        });
    }

    // Create line graph for ARIMA predicted values using search trend and
    // weather metric.
    if (has_search_temp_predict) {
        svg_line_chart.selectAll(".line")
            .data(nested_predict_output)
            .enter()
            .append("path")
            .attr("d", function (d) {
                return d3.line().x(function (d) {
                    return x(new Date(d.date));
                }).y(function (d) {
                    return y(d.predict_search_temp);
                })
                (d.values)
            })
            .attr("stroke", function (d) {
                return "#0f9d58";
            })
            .attr("fill", "none");

        nested_predict_output.forEach(function (d) {
            d.values.forEach(function (v) {
                svg_line_chart.append("circle")
                    .attr("fill", "#0f9d58")
                    .attr("stroke", "#0f9d58")
                    .attr("cx", function () {
                        return x(new Date(v.date));
                    })
                    .attr("cy", function () {
                        return y(v.predict_search_temp);
                    })
                    .attr("r", 2);
            });
        });
    }

    // Add the axes
    svg_line_chart.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${line_graph_height - margin.bottom})`)
        .call(xAxis);
    svg_line_chart.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(yAxis);

    // Add title of line chart
    svg_line_chart.append("text")
        .attr("transform", "translate(0,0)")
        .attr("y", margin.top - 40)
        .attr("x", (line_graph_width + margin.left) / 2)
        .attr("font-size", "18px")
        .attr("text-anchor", "middle")
        .text("Actual Searches vs. ARIMA predictions for " +
            county_data.county + " for " + county_data.symptom);

    // Add title to x-axis
    svg_line_chart.append("text")
        .attr("transform",
            "translate(" + ((line_graph_width + margin.left) / 2) + "," +
            (line_graph_height) + ")")
        .style("text-anchor", "middle")
        .text("Timeline");

    // Add title to y-axis
    svg_line_chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0 - line_graph_height / 2)
        .attr("y", margin.right - 40)
        .style("text-anchor", "middle")
        .text("Normalized Searches");

    // Add the legend
    svg_line_chart.selectAll(".legend").remove();
    var legend_keys = ["Actual normalized searches"];
    var legend_color = ["#4285f4"];
    if (has_search_predict) {
        legend_keys.push("Prediction: Search trends only");
        legend_color.push("#db4437");
    }
    if (has_temp_predict) {
        legend_keys.push("Prediction: Weather metric only");
        legend_color.push("#f4b400");
    }
    if (has_search_temp_predict) {
        legend_keys.push("Prediction: Search trends & weather metric");
        legend_color.push("#0f9d58");
    }

    var line_legend = svg_line_chart.selectAll(".lineLegend")
        .data(legend_keys)
        .enter()
        .append("g")
        .attr("class", "lineLegend")
        .attr("transform", function (d, i) {
            return "translate(" + (line_graph_width) + "," +
                (margin.top + i * 20) + ")";
        });

    // Add the legend text
    line_legend.append("text")
        .text(function (d) {
            return d;
        }).attr("x", 26)
        .attr("y", 10)
        .attr("dy", ".35em");

    // Add the colors
    line_legend.append("rect")
        .attr("fill", function (d, i) {
            return legend_color[i];
        })
        .attr("width", 20)
        .attr("height", 20);
}

/**
 * Draws the bar graph for comparison between RMSE value for different models
 * for the specified county. Using this comparison user should be easily able to
 * identify the best fot training model for the selected symptom for this county
 *
 * @param county_data specified county data to draw the bar graph
 */
function barchart_draw(county_data) {
    // Do nothing if the specified county data is undefined
    if (county_data === undefined) {
        return;
    }

    // Create the data set for bar chart
    var bar_graph_data = [];
    if (county_data.rmse_search !== -1) {
        bar_graph_data.push({
            "type": "Search Symptoms",
            "value": county_data.rmse_search,
            "label": "Search trends only",
        });
    }
    if (county_data.rmse_temp !== -1) {
        bar_graph_data.push({
            "type": "Temperature + Humidity",
            "value": county_data.rmse_temp,
            "label": "Weather metric only",
        });
    }
    if (county_data.rmse_search_and_temp !== -1) {
        bar_graph_data.push({
            "type": "Temperature + Search Symptoms + Humidity",
            "value": county_data.rmse_search_and_temp,
            "label": "Search trends and weather metric",
        });
    }

    // create scales x & y for X and Y axis and set their ranges
    var x_b = d3.scaleLinear()
        .range([margin.left, bar_graph_width - margin.right])
        .domain([0, d3.max(bar_graph_data, function (d) {
            return d.value
        })]);
    var y_b = d3.scaleBand()
        .range([bar_graph_height - margin.bottom, margin.top])
        .domain(bar_graph_data.map(function (d) {
            return d.type;
        }))
        .padding(.4);

    // Add axes to the bar graph
    svg_bar_chart.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${bar_graph_height - margin.bottom})`)
        .call(d3.axisBottom(x_b));
    svg_bar_chart.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y_b).tickFormat(""));

    // Add title to x-axis
    svg_bar_chart.append("text")
        .attr("transform",
            "translate(" + ((bar_graph_width + margin.left) / 2) + "," +
            (bar_graph_height) + ")")
        .style("text-anchor", "middle")
        .text("RMSE");

    // Add title to y-axis
    svg_bar_chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", 0 - bar_graph_height / 2)
        .attr("y", margin.left - 20)
        .style("text-anchor", "middle")
        .text("Training Model");


    // Add title of bar chart
    svg_bar_chart.append("text")
        .attr("transform", "translate(0,0)")
        .attr("y", margin.bottom - 20)
        .attr("x", (bar_graph_width + margin.left) / 2)
        .attr("font-size", "18px")
        .attr("text-anchor", "middle")
        .text("Model Comparison for " + county_data.county + " for " +
            county_data.symptom);

    // Add horizontal bars
    var bar = svg_bar_chart.selectAll(".bar")
        .data(bar_graph_data)
        .enter()
        .append("rect")
        .attr("x", x_b(0))
        .attr("y", function (d) {
            return y_b(d.type);
        })
        .attr("width", function (d) {
            return x_b(d.value) - x_b(0);
        })
        .attr("height", y_b.bandwidth())
        .attr("fill", function (d) {
            return color(d.value);
        });

    // Add Model details for each bar
    svg_bar_chart.selectAll(".bar")
        .data(bar_graph_data)
        .enter()
        .append("text")
        .attr("dy", "3em")
        .attr("y", function (d) {
            return y_b(d.type);
        })
        .attr("x", function (d) {
            return x_b(d.value) + x_b(0) / 2;
        })
        .attr("text-anchor", "left")
        .text(function (d) {
            return d.label;
        })
        .style("font-size", "12px")
        .style("font-family", "Roboto, Arial, sans-serif")
        .style("fill", "#000000");

    // Add the legend for the graph
    svg_bar_chart.selectAll(".legend").remove();
    var legend = svg_bar_chart.selectAll(".legend")
        .data(color.ticks(10).slice(1).reverse())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function (d, i) {
            return "translate(" +
                (bar_graph_width + margin.left + margin.right + 100) + "," +
                (margin.top + i * 20) + ")";
        });

    // Add the color boxes
    legend.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", color);

    // Add the text for each color
    legend.append("text")
        .attr("x", 26)
        .attr("y", 10)
        .attr("dy", ".35em")
        .text(d3.format(".2f"));
}