const margins = { "top": 10, "right": 40, "bottom": 10, "left":30 };
const regions_map = {
    "15": "Гродненская область",
    "16": "Брестская область",
    "17": "Минская область",
    "21": "Витебская область",
    "22": "Могилевская область",
    "23": "Гомельская область",
    "170": "г. Минск",
    "375": "Республика Беларусь"
};
const indicators_map = {
    "1": "Кредиторская задолженность",
    "2": "Просроченная кредиторская задолженность",
    "3": "Дебиторская задолженность",
    "4": "Просроченная дебиторская задолженность"
};
const areas_map = {
	0: "ВСЕГО",
    1: "Cтроительство",
    2: "Информация и связь",
    3: "Операции с недвижимым имуществом",
    4: "Промышленность",
    5: "Образование",
    6: "Оптовая и розничная торговля; ремонт автомобилей и мотоциклов",
    7: "Сельское, лесное и рыбное хозяйство"
}
const table_headers_map = {
	"0": "Вид деятельности",
    "1": "Кредиторская задолженность",
    "2": "Просроченная кредиторская задолженность",
    "3": "Дебиторская задолженность",
    "4": "Просроченная дебиторская задолженность"
}
// Не выводить месяцы вообще - только засечки.
const months_map = {
    "0": "I",
    "1": "II",
    "3": "III",
    "4": "IV",
    "5": "VI",
    "6": "VII",
    "7": "VIII",
    "8": "IX",
    "9": "X",
    "10": "XI",
    "11": "XII"
};

var state_map = {
	"region": "375",
	"indicator": "1",
	"type": "0",
	"date": null
};

var data_main, area_graph_group;

// Карта предпросмотра с областями и Минском
var preview_map_projection = d3.geoMercator()
                   .center([27.9, 53.7])
                   .scale(1200);
var preview_map_path = d3.geoPath()
    .projection(preview_map_projection);
var preview_map_color = d3.scaleQuantize()
              .range(['#f2f0f7','#cbc9e2','#9e9ac8','#6a51a3']);

// Элементы графика
var main = d3.select("main");
var menu = main.append("div")
            .attr("id", "menu");
var svg_area = main.append("div")
                .attr("id", "svg_area");

// Определяем ширину блока:
var svg_width = d3.select("#svg_area").node().getBoundingClientRect().width;

// Шкалы для графика
var y_scale = d3.scaleLinear()
                .range([180, 10]);
var x_scale = d3.scaleTime()
                .range([0, svg_width / 3]);

// Таблица
var table = d3.select("main").append("table");
var caption = table.append("caption");
var thead = table.append("thead").append("tr");
var tbody = table.append("tbody");

var line = d3.line()
            .x(function(d) {
                return x_scale(d.date);
            })
            .y(function(d) { return y_scale(+d.amount); });

var area = d3.area()
            .x(function(d) {
                return x_scale(d.date);
            })
            .y0(180)
            .y1(function(d) { return y_scale(+d.amount); });

var x_axis = d3.axisBottom(x_scale)
                .tickFormat(function(d) { return format_tick(d); });
var y_axis = d3.axisLeft(y_scale)
                .ticks(5)
            //.tickFormat(function(d) { return formatter(d); });


// Цветовая карта вида: 375: amount; ...
var color_map = {};


// Отбор данных для ячеек таблицы по порядку
function get_cell_data(row_data) {
	let temp_arr = row_data.values.map((d) => { return d.amount; });
	temp_arr.unshift(areas_map[row_data.key]);
    return temp_arr;
}

function format_tick(datum) {
    let month = datum.getMonth();
    return month == 0 ? datum.getFullYear() : months_map[month];
}

function initialize(data, map_data) {

// Преобразуем строковые даты в настоящие и сортируем по возрастанию даты.
    data.forEach(function(d, i) {
            data[i]["date"] = new Date(d["date"]);
        });
    data.sort(function(a, b) { return a["date"] - b["date"]; });
	data_main = data;
    console.log(data);

// Создаем селекторы меню
    menu.append("select")
        .attr("id", "region_selector")
		.on("change", function(d) {
			let selected_region = d3.select(this).node().value;
			state_map["region"] = selected_region;
			// redraw(data_main, state_map);
		})
    menu.append("select")
        .attr("id", "indicator_selector")
		.on("change", function(d) {
			let selected_indicator = d3.select(this).node().value;
			state_map["indicator"] = selected_indicator;
			// redraw(data_main, state_map);
		})

    let dates_range = Array.from(new Set(data.map(function(d) {
                        return d["date"]; }
    )));
	
	state_map["date"] = d3.max(dates_range);

    amount_extent = d3.extent(data, function(d) { return +d.amount; });
    
    x_scale.domain([dates_range[0], dates_range[dates_range.length - 1]]);
    y_scale.domain(amount_extent);

    grafik = svg_area.append("svg")
                .attr("class", "grafik")
                //.attr("width", "100%")
                .attr("viewBox", "0 0 800 300")
                .attr("preserveAspectRatio", "xMidYMid meet");
// График долга
    area_graph_group = grafik.append("g")
                .attr("id", "area_graph")
                .attr("transform", "translate(0, 0)");

// Карта предпросмотра
    let preview_map_group = grafik.append("g")
                    .attr("id", "preview_map")
                    .attr("transform", "translate(80, -140)");
    let preview_map = preview_map_group.selectAll("path")
// Вставляем карту
    preview_map.data(map_data.features)
        .enter()
        .append("path")
        .attr("id", function(d) {
            return d.properties.subject; 
        }) 
        .attr("d", preview_map_path)
        .attr("stroke", "black")
        .attr("stroke-width", "1px")
        .attr("fill", "white")
        .on("mouseover", function(d) {
            let xPos = d3.event.pageX + "px";
            let yPos = d3.event.pageY + "px";
            d3.select("#preview_tooltip")
                .style("left", xPos)
                .style("top", yPos)
                //.classed("hidden", false);  
            d3.select("#region")    
                .text(d.properties.region_name); 
            d3.select("#amount")
                .text(d.properties.amount);
        })
        .on("mouseout", function(d) {
            d3.select("#preview_tooltip")
                .classed("hidden", true)
        });
// Добавляем Минск
    preview_map_group.append("circle")
        .attr("cx", function(d) {
            return preview_map_projection([27.5666, 53.9])[0];
        })
        .attr("cy", function(d) {
            return preview_map_projection([27.5666, 53.9])[1]; 
        })
        .attr("r", 12)
        .attr("fill", "white")
        .attr("stroke", "black")
        .attr("opacity", "1")
        .on("mouseover", function(d) {
            let xPos = d3.event.pageX + "px";
            let yPos = d3.event.pageY + "px";
            d3.select("#preview_tooltip")
                .style("left", xPos)
                .style("top", yPos)
                .classed("hidden", false);
            d3.select("#region")    
                .text("г. Минск");
            d3.select("#amount")
                .text(formatter(d));
        })
        .on("mouseout", function(d) {
            d3.select("#preview_tooltip")
                .classed("hidden", true)
        });
// Перерисовываем график, карту и таблицу
	redraw_graph();
	redraw_table();
}
function redraw_table() {
	let table_data = data_main.filter((d) => {
		return d.region == state_map.region &&
				d.date.getTime() == state_map.date.getTime();
	});

	let table_headers = Array.from(new Set(table_data.map((d) => {
		return d.ind;
	})));
	table_headers.sort((a, b) => { return a - b; });
	table_headers.unshift("0");

	let ths = thead.selectAll("th")
		.data(table_headers);
	ths.enter()
		.append("th")
		.text((d) => { return table_headers_map[d]; });
	ths.text((d) => { return table_headers[d]; });
	ths.exit().remove();

// Группировка данных для таблицы с сортировкой по видам деятельности
	let row_data = d3.nest().key(function(d) { return d.type; }).sortKeys(d3.descending).sortValues(function(d) { return d.ind; }).entries(table_data);

	console.log("row_data", row_data);
	
	let trows = tbody.selectAll("tr")
					.data(row_data);
	trows.enter()
		.append("tr")
		.selectAll("td")
		.data(function(d) { return get_cell_data(d); })
		.enter()
		.append("td")
		.text(function(d) { return d; }); // Убрать текст из cell_data, добавить через function(d, i) ...

	let tcells = trows.selectAll("td")
					.data(function(d) { return get_cell_data(d); })
					.text(function(d) { return d; });
	tcells.exit().remove();
	trows.exit().remove();

}

function redraw_graph() {
// Данные для графика
	let grafik_data = data_main.filter(function(d) {
        return d.region == state_map.region &&
			d.ind == state_map.indicator &&
			d.type == state_map.type;
    });
// Данные для таблицы
    console.log("extent", d3.extent(grafik_data, function(d) { return +d.amount; }));
    
    let dates_range = Array.from(new Set(grafik_data.map(function(d) {
                        return d["date"];
        }
    )));
// Создаем селекторы из данных
    let region_codes = Array.from(new Set(data_main.filter(function(d) {
        return d.type == state_map.type;
    }).map(function(d) {
        return d.region
    })));
    let indicator_codes = Array.from(new Set(data_main.map(function(d) {
        return d.ind;
    })));
// Сортируем индикаторы
	indicator_codes.sort(function(a, b) { return a - b; });

	menu.select("#region_selector")
		.selectAll("option")
        .data(region_codes)
        .enter()
        .append("option")
		.attr("value", function(d) { return d; })
        .text(function(d) { return regions_map[d] })
	menu.select("#indicator_selector")
		.selectAll("option")
        .data(indicator_codes)
        .enter()
        .append("option")
		.attr("value", function(d) { return d; })
        .text(function(d) { return indicators_map[d] });

    x_scale.domain([dates_range[0], dates_range[dates_range.length - 1]]);
    y_scale.domain([0, d3.max(grafik_data, function(d) { return +d.amount; })]);
    
    x_axis_group = d3.select("#area_graph").append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + margins.left + ", 180)");
    y_axis_group = d3.select("#area_graph").append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + margins.left + ", 0)");
    y_axis_group
            .transition().duration(500)
            .call(y_axis);
    x_axis_group
        .transition().duration(500)
        .call(x_axis);
    
    area_graph_group
        .append("g")
        .attr("class", "area")
        .attr("transform", "translate(" + margins.left + ", 0)")
        .append("path")
        .datum(grafik_data)
        .attr("fill", "steelblue")
        .attr("opacity", ".5")
        .attr("d", area);
    area_graph_group
        .append("g")
        .attr("class", "line")
        .attr("transform", "translate(" + margins.left + ", 0)")
        .append("path")
        .datum(grafik_data)
        .attr("d", line);
    
    area_graph_group
        .append("g")
        .attr("class", "circles")
        .attr("transform", "translate(" + margins.left + ", 0)")
        .selectAll("circle")
        .data(grafik_data)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x_scale(d.date); })
        .attr("cy", function(d) { return y_scale(+d.amount); })
        .attr("r", "2");
    //line_graph.transition().duration(500)
        //.attr("d", line(selected_data))
        //.attr("class", "line_graph");

}

d3.csv("data/data.csv", function(data) {
    d3.json("data/preview_map.geojson", function(map_data) {
        initialize(data, map_data);
    });
});

