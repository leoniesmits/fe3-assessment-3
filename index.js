// start with a function to make the svg's within the div
// give parameters id (refers to the div) and myData (the dataset)
// instead of .scale.ordinal I used a function to give the elements a fixed color
// the colors are important for the meaning of the words, they will help the user understand 
function makeCharts(id, myData){
    function sentimentColor(c){ 
        return {negative:"#F97C7C",
                neutral:"#CCCCCC",
                positive:"#58E8A9"}[c];
            }
    
// use a forEach loop on myData to add the index of the sentiments
// use d.total to add these numbers
// this is to use in the pie chart
    myData.forEach(function(d) {
        d.total=d.sentiment.negative+d.sentiment.neutral+d.sentiment.positive;
    });
    
// function to create the piechart
// start with variable pieChart with an empty array
// the empty array is later used in a function, to directly store this in the right place
// refer to the parameter piedata, this is to use in this function
// and in the piechart to make sure the same data is altered and used
    function pieChart(pD){
        var pC ={};
                
// create svg for pie chart 
// select the id and make an svg with classes, width and location
// store this in a variable
        var pCsvg = d3.select(id)
            .append("svg")
            .attr("class", "piechart")
            .attr("width", 250).attr("height", 250).append("g")
            .attr("transform", "translate(125,125)");
        
// create function to draw the pie chart as a round chart
// usually, .math is used to calculate the radius
// since I use 250 for width and height and these are static
// I just devided them by 2
        var path = d3.arc()
            .outerRadius(125)
            .innerRadius(0);

// use .layout.pie to transform the data into this specific format
// all new data constructed by hovering the bar chart, will go through this part
// a list of the number of sentiments per year are given to the pie
        var pie = d3.pie()
            .sort(null).value(function(d) { 
                return d.sentiment; 
            });


// select the paths and refer to the parameter in function pieChart 
// make the path and in attribute d, refer to the variable path for the proper radius
// use a function with parameter to the data, with .each 
// get access to the specific index of the selected piece of data
// another function, to fill the slices with the right colors
// return the variable that has the colors stored and make it return to the d.data.type
// then, start a mouseover and a mouseout event to use later in connection with the bar chart
        pCsvg.selectAll("path")
            .data(pie(pD))
            .enter()
            .append("path")
            .attr("d", path)
            .each(function(d) { 
                this.current = d; 
            })
            .style("fill", function(d) { 
                return sentimentColor(d.data.type); 
            })
            .on("mouseover",mouseover)
            .on("mouseout",mouseout);


// create function to update pie chart
// the pie chart will be updated by the bar chart later
// use the parameter yearSentiment
// this refers to a variable that has the right year and sentiment stored
// .attrTween is used to let something follow a path
// in this case, it's the path of the pie chart
        pC.update = function(yearSentiment){
            pCsvg.selectAll("path")
            .data(pie(yearSentiment))
            .transition().duration(400)
// the .attrTween directs the d attribute to the following function
// .interplolate lets you insert a path between the  transitions
// the pie slices are animated and the paths are draws as the pie chart has to be
// as seen here: http://bl.ocks.org/mbostock/5100636   
            .attrTween("d", function pieSlices(a) {
                var i = d3.interpolate(this.current, a);
                this.current = i(0);
                return function(t) { 
                    return path(i(t));    
                };
            })   
        }    
  
    
// use a function to hover the pie chart slice and refer this to the right year
        function mouseover(d){
// call another function to update the bar chart with new data, selected by the bar chart slice
// use a variable and return to give back the right color of the selected bar chart slice to the bar chart rects
            bC.update(myData.map(function(v){ 
                return [v.year,v.sentiment[d.data.type]];})
                ,sentimentColor(d.data.type));
        }

// after this mouseover, make a mouseout function to reset the color and data
        function mouseout(d){
            
// call an update in the bar chart refering to the dataset and return the previous data and color
            bC.update(myData.map(function(v){
                return [v.year,v.total];}), "#8DD4F4");
        }

// return the pie chart, drawing it with all the transitions it gets from the update  
        return pC;
    }

// to update the pie chart, map the sentiments from the code as an array
// in the .map, write a function to put the sentiments as type 
// use d3.sum to specify you need the value of these sentiments data
// first return this value and then return the type of sentiment in the data
    var updatePC = ['negative','neutral','positive']
        .map(function(d) { 
            return {type:d, sentiment: d3.sum(myData.map(function(t) { 
                return t.sentiment[d];
            }))};
        });    
    
// move on to the legend, start again with an empty array
    function legend(lD){
        var leg = {};
            
// create a table inside the ID to work semantic inside the DOM
        var legend = d3.select(id).append("table").attr('class','legend');
        
// for every sentiment (negative, positive and neutral) create a tr
// after .data, refer to a variable 
        var tr = legend.append("tbody").selectAll("tr").data(lD).enter().append("tr");
            
// give each tr a td with heights and a rectangle representing the color refering to the pie chart slices
// they have to represent the same colors and change with these colors
// the variable sentimentColor makes sure the same data is in the same places
        tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
            .attr("width", '16').attr("height", '16')
			.attr("fill",function(d){ return sentimentColor(d.type); });
            
// create a second td for each sentiment tr, give this the text of the sentiment
// (negative, neutral or positive)
        tr.append("td").text(function(d){ return d.type;});

// for a 3rd td, give the text the number 
        tr.append("td").attr("class",'legendsentiment')
            .text(function(d) { 
                return d3.format("1")(d.sentiment);
            });

// create the 4th td and refer to a function called getLegend
        tr.append("td").attr("class",'legendPerc')
            .text(function(d) { 
                return getLegend(d,lD);
            });

// for all the tbody elements, redirect to the variable that has the right year and sentiment stored
        leg.update = function(yearSentiment){
// update the data attached to the tr elements
            var l = legend.select("tbody").selectAll("tr").data(yearSentiment);

// update the number of sentiments in the legend 
            l.select(".legendsentiment").text(function(d){ return d3.format(",")(d.sentiment);});

// update the percentage of sentiments
            l.select(".legendPerc").text(function(d){ return getLegend(d,yearSentiment);});        
        }

// write a function to calculate the percentage of the sentiments
// use parameter dValue and later return this value as .map to construct a new map
// first, return the format % for the sentiments devided by d3.sum
// this specifies that you want the value (0 to 20 or something)
// make a new map (array) with .map and return 
// use parameter v and return v.sentiment to give the value of selected sentiment to legend
        function getLegend(d,dValue){ 
            return d3.format(".0%")(d.sentiment/d3.sum(dValue.map(function(v) { 
                return v.sentiment; 
            })));
        }
        return leg;
    }


// function to make bar chart
// use parameter bcData to refer later to bar chart data
// start with an empty array called bC
// in variable bcSizes, store the measurements
// in bcSizes width and height, put their height and width (-length -radius)
    function barChart(bcData){
        var bC={},    
        bcSizes = {t: 60, r: 0, b: 30, l: 0};
        bcSizes.w = 500 - bcSizes.l - bcSizes.r, 
        bcSizes.h = 300 - bcSizes.t - bcSizes.b;
            
// create the svg for barChart inside the div
// for the width, put .width + length + radius
// for height. put height + 
        var bCsvg = d3.select(id).append("svg")
            .attr("class", "barChart")
            .attr("width", bcSizes.w + bcSizes.l + bcSizes.r)
            .attr("height", bcSizes.h + bcSizes.t + bcSizes.b)
            .append("g")
            .attr("transform", "translate(" + bcSizes.l + "," + bcSizes.t + ")");

// for the x variable, use map to 
        var x = d3.scaleBand()
        // .rangeRoundBands([0, bcSizes.w], 0.1)
        .range([0, bcSizes.w])
        .round(0.1)
        .domain(bcData.map(function(d) { 
            return d[0]; 
        }));

        // Add x-axis to the barChart svg.
        bCsvg.append("g").attr("class", "x axis")
            .attr("transform", "translate(0," + bcSizes.h + ")")
            .call(d3.axisBottom(x));

        // Create function for y-axis map.
        var y = d3.scaleLinear().rangeRound([bcSizes.h, 0])
                .domain([0, d3.max(bcData, function(d) { return d[1]; })]);

        // Create bars for barChart to contain rectangles and sentiment labels.
        var bars = bCsvg.selectAll(".bar")
            .data(bcData)
            .enter()
            .append("g")
            .attr("class", "bar");

        
// create the bars
// for x, use return x variable with (d[0]) to determine the location on x axis
// for y, use function return the y variable width (d[1]) to determine the height (this is still undefined)
// for the width, use x variable with rageband to use the same width
// for height, use a function to return bcSizes.height - the height of the negative space due to (d[1])
        bars.append("rect")
            .attr("x", function(d) { 
                return x(d[0]); 
            })
            .attr("y", function(d) { 
                return y(d[1]); 
            })
            .attr("width", 40)
            .attr("height", function(d) { 
                return bcSizes.h - y(d[1]); 
            })
            .attr('fill', "#8DD4F4")
            .on("mouseover",mouseover)
            .on("mouseout",mouseout);

// another mouseover function, this time on the bar chart 
// store the selected year in a variable with a function
// first, filter the year out of the data with a comparison
// the mouseover year has to be true, all the others are false
// return the comparison between s.year (selected year) and d[0] (the years)  
// after this function, add the [0] to refer to the sentiment in the data
// then in another variable, store the selected year variable and sentiment in a new
// array with .key and use .map to make an object with the selected year and sentiment
        function mouseover(d){ 
            var selectedYear = myData.filter(function(s){ 
                return s.year == d[0]
                ;})[0];
            var yearSentiment = d3
                .keys(selectedYear.sentiment)
                .map(function(s){ 
                    return {type:s, sentiment:selectedYear.sentiment[s]};
                });
               
// call the functions that update the pie chart and legend, to connect this to the mouseover of bar chart
// refer to the yearSentiment, becaue this new variable tells what data is selected   
            pC.update(yearSentiment);
            leg.update(yearSentiment);
        }

// in a function for mouseout, reset the pie chart and legend by refering to 
// the update function before the bar chart was touched        
        function mouseout(d){     
            pC.update(updatePC);
            leg.update(updatePC);
        }
        
// after the bar chart can alter the pie chart, now write a function to make
// the pie chart update the bar chart
// in the y domain, use yearSentiment to sort the sentiments in the years
// and eliminate the bar height for other sentiments
// give parameter color to change the color of the bars to the selected pie chart slice
        bC.update = function(yearSentiment, color){
            y.domain([0, d3.max(yearSentiment, function(d) { 
                return d[1]; 
            })]);
            
// recreate the bars with the new data
// only the data in the selected sentiment is added now
            var bars = bCsvg.selectAll(".bar")
                .data(yearSentiment);
            
// with a transition, create the y, height, and color over again
// this is a copy of the attributes as they were in the creation of the bars
// only attribute fill is different, this refers to the parameter in this function
            bars.select("rect").transition().duration(400)
                .attr("y", function(d) {
                    return y(d[1]); 
                })
                .attr("height", function(d) { 
                    return bcSizes.h - y(d[1]); 
                })
                .attr("fill", color);
          
        }      

// return the bar chart with the new data  
        return bC;
    }
    
    
// for all the sentiments, use .map on the data to return an array of all the years
// and the sentiments per year
    var allTotal = myData.map(function(d) {
        return [d.year,d.total];
    });

// as final step, create variables to store the array of all the data in the previous functions making the svg's
// for the bar chart, refer to the barChart function with all the years as arrays as parameter
// for the piechart and legend, refer to their functions with the update of piechart
    var bC = barChart(allTotal),
        pC = pieChart(updatePC), 
        leg= legend(updatePC);  
}