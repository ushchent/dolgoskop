const margins = { "top": 10, "right": 40, "bottom": 10, "left":30 };
const regions_map = {
    15: "Гродненская область",
    16: "Брестская область",
    17: "Минская область",
    21: "Витебская область",
    22: "Могилевская область",
    23: "Гомельская область",
    170: "г. Минск",
    375: "Республика Беларусь"
};
const indicators_map = {
    1: "Кредиторская задолженность",
    2: "Просроченная кредиторская задолженность",
    3: "Внешняя кредиторская задолженность",
    4: "Внешняя просроченная кредиторская задолженность",
    5: "Дебиторская задолженность",
    6: "Просроченная дебиторская задолженность",
    7: "Внешняя дебиторская задолженность",
    8: "Внешняя просроченная дебиторская задолженность",
};
const types_map = {
    0: "ВСЕГО",
    1: "Cтроительство",
    2: "Информация и связь",
    3: "Операции с недвижимым имуществом",
    4: "Промышленность",
    5: "Образование",
    6: "Оптовая и розничная торговля; ремонт автомобилей и мотоциклов",
    7: "Сельское, лесное и рыбное хозяйство",
    8: "Профессиональная, научная и техническая деятельность"
}
const table_headers_map = {
    0: "Вид деятельности",
    1: "Кредиторская задолженность",
    2: "Просроченная кредиторская задолженность",
    3: "Внешняя кредиторская задолженность",
    4: "Внешняя просроченная кредиторская задолженность",
    5: "Дебиторская задолженность",
    6: "Просроченная дебиторская задолженность",
    7: "Внешняя дебиторская задолженность",
    8: "Внешняя просроченная дебиторская задолженность",
}
// Вариант - не выводить месяцы вообще - только засечки.
const months_map_roman = {
    0: "I",
    1: "II",
    3: "III",
    4: "IV",
    5: "VI",
    6: "VII",
    7: "VIII",
    8: "IX",
    9: "X",
    10: "XI",
    11: "XII"
};
const months_map_cyrillic = {
    0: "января",
    1: "февраля",
    2: "марта",
    3: "апреля",
    4: "мая",
    5: "июня",
    6: "июля",
    7: "августа",
    8: "сентября",
    9: "октября",
    10: "ноября",
    11: "декабря"
};
function parse_date_human(date) {
    let day_num = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    let date_string = "На " + day_num + " " +
        months_map_cyrillic[month] + " " +
        year + " г.";
    return date_string;
}
var t = d3.transition()
        .duration(1000);

var state_map = {
    "region": "375",
    "indicator": "1",
    "type": "0",
    "date": null
};
var amounts_by_region = {
    170: null,
    17: null,
    23: null,
    22: null,
    21: null,
    16: null,
    15: null
};

function set_amounts_by_region() {
    var selection = data_main.filter(d =>
        d.region != "375" &&
        d.ind == state_map.indicator &&
        d.type == state_map.type &&
        d.date.getTime() == state_map.date.getTime());
    for (let i = 0; i < selection.length; i++) {
        amounts_by_region[selection[i].region] = selection[i].amount;
    }
}
// Глобальные переменные
var data_main, area_graph_group;

// Карта предпросмотра с областями и Минском
var preview_map_projection = d3.geoMercator()
                   .center([27.9, 53.7])
                   .scale(1200);
var preview_map_path = d3.geoPath()
    .projection(preview_map_projection);
var preview_map_color = d3.scaleQuantize()
              .range(['#edf8e9','#bae4b3','#74c476','#238b45']);

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
                .range([0, svg_width - (svg_width * 0.52)]);

// Таблица
var table = d3.select("main").append("table");
var caption = table.append("caption");
var thead = table.append("thead").append("tr");
var tbody = table.append("tbody");

var line = d3.line()
            .x(d => x_scale(d.date))
            .y(d => y_scale(+d.amount));

var area = d3.area()
            .x(d => x_scale(d.date))
            .y0(180)
            .y1(d => y_scale(+d.amount));

var x_axis = d3.axisBottom(x_scale)
                .tickFormat(d => format_tick(d));
var y_axis = d3.axisLeft(y_scale)
                .ticks(5)
            //.tickFormat(function(d) { return formatter(d); });

// Отбор данных для ячеек таблицы по порядку
function get_cell_data(row_data) {
    let temp_arr = [];
    let keys = d3.keys(indicators_map);
    for (let i=0; i<keys.length; i++) {
        if (row_data.values.indexOf(row_data.values[i]) != -1) {
            temp_arr.push(row_data.values[i].amount);
        } else {
            temp_arr.push(0);
        }
    }
    temp_arr.unshift(types_map[row_data.key]);
    return temp_arr;
}

function format_tick(datum) {
    let month = datum.getMonth();
    return month == 0 ? datum.getFullYear() : months_map_roman[month];
}

function initialize(data, map_data) {

// Преобразуем строковые даты в настоящие и сортируем по возрастанию даты.
    data.forEach(function(d, i) {
            data[i]["date"] = new Date(d["date"]);
            data[i].amount = +data[i].amount;
        });
    data.sort(function(a, b) { return a["date"] - b["date"]; });
    data_main = data;

// Создаем селекторы меню
    menu.append("select")
        .attr("id", "region_selector")
        .on("change", function(d) {
            let selected_region = d3.select(this).node().value;
            state_map["region"] = selected_region;
            redraw_table();
            redraw_graph();
        })
    menu.append("select")
        .attr("id", "indicator_selector")
        .on("change", function(d) {
            let selected_indicator = d3.select(this).node().value;
            state_map["indicator"] = selected_indicator;
            redraw_graph();
            redraw_map();
        })

    let dates_range = Array.from(new Set(data.map(function(d) {
                        return d["date"]; }
    )));
    
    state_map["date"] = d3.max(dates_range);

    grafik = svg_area.append("svg")
                .attr("class", "grafik")
                .attr("width", svg_width)
                .attr("viewBox", "0 0 800 220")
                .attr("preserveAspectRatio", "xMidYMid meet");
// График долга
    area_graph_group = grafik.append("g")
                .attr("id", "area_graph")

    area_graph_group.append("g")
                .attr("class", "area")
                .attr("transform", "translate(" + margins.left + ", 0)")
                .append("path");

    area_graph_group.append("g")
        .attr("class", "line")
        .attr("transform", "translate(" + margins.left + ", 0)")
        .append("path");
    area_graph_group
        .append("g")
        .attr("class", "circles")
        .attr("transform", "translate(" + margins.left + ", 0)");

    area_graph_group.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + margins.left + ", 180)");
    area_graph_group.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + margins.left + ", 0)");
// Карта предпросмотра
    let preview_map_group = grafik.append("g")
                    .attr("id", "preview_map")
                    .attr("transform", "translate(200, -140)");
    let preview_map = preview_map_group.selectAll("path")
// Вставляем карту
    preview_map.data(map_data.features)
        .enter()
        .append("path")
        .attr("id", d => d.properties.subject) 
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
        .attr("cy", d => preview_map_projection([27.5666, 53.9])[1])
        .attr("r", 12)
        .attr("id", "minsk")
        .attr("stroke", "black")
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
        .on("mouseout", function() {
            d3.select("#preview_tooltip")
                .classed("hidden", true)
        });
// Перерисовываем график, карту и таблицу
    redraw_graph();
    redraw_map();
    redraw_table();
}
function redraw_table() {
    table.select("caption")
        .text(parse_date_human(state_map.date));

    let table_data = data_main.filter((d) => {
        return d.region == state_map.region &&
                d.date.getTime() == state_map.date.getTime();
    });

    let table_headers = Array.from(new Set(
                            table_data.map(d => d.ind)
                            )
                        );
    table_headers.sort((a, b) => a - b);
    table_headers.unshift("0");

    let ths = thead.selectAll("th")
        .data(table_headers);
    ths.enter()
        .append("th")
        .transition(t)
        .text(d => table_headers_map[d]);
    ths.transition(t)
        .text(d => table_headers_map[d]);
    ths.exit()
        .transition(t)
        .remove();

// Группировка данных для таблицы с сортировкой по видам деятельности
    let row_data = d3.nest().key(d => d.type)
                    .sortKeys(d3.descending)
                    .sortValues((a, b) => a.ind - b.ind)
                    .entries(table_data);

    let trows = tbody.selectAll("tr")
                    .data(row_data);
    trows.enter()
        .append("tr")
        .selectAll("td")
        .data(d => get_cell_data(d))
        .enter()
        .append("td")
        .transition(t)
        .text(d => d); // Убрать текст из cell_data, добавить через function(d, i) ...

    let tcells = trows.selectAll("td")
                    .data(d => get_cell_data(d))
                    .text(d => d);
    tcells.exit().remove();
    trows.exit()
        .transition(t)
        .remove();
}

function redraw_graph() {
// Данные для графика
    let grafik_data = data_main.filter(function(d) {
        return d.region == state_map.region &&
            d.ind == state_map.indicator &&
            d.type == state_map.type;
    });

    let dates_range = Array.from(new Set(grafik_data.map(function(d) {
                        return d["date"];
        }
    )));
    dates_range.sort((a, b) => a.getTime() - b.getTime());
// Создаем селекторы из данных
    let region_codes = Array.from(new Set(data_main.filter(d => 
            d.type == state_map.type).map(d => d.region)));
    let indicator_codes = Array.from(new Set(data_main.map(d => d.ind)));
// Сортируем регионы и индикаторы
    indicator_codes.sort((a, b) => a - b);
    region_codes.sort((a, b) => b - a);

    let region_options = menu.select("#region_selector")
        .selectAll("option")
        .data(region_codes)
    region_options.enter()
        .append("option")
        .attr("value", d => d)
        .text(d => regions_map[d])
    region_options.text(d => regions_map[d]);
    region_options.exit()
        .remove();

    let indicator_options = menu.select("#indicator_selector")
        .selectAll("option")
        .data(indicator_codes);
    indicator_options.enter()
        .append("option")
        .attr("value", d => d)
        .text(d => indicators_map[d]);
    indicator_options.text(d => indicators_map[d]);
    indicator_options.exit()
        .remove();

    x_scale.domain([dates_range[0], dates_range[dates_range.length - 1]]);
//x_scale.domain(dates_range.map(d => d.toISOString().slice(0,10)));
    y_scale.domain([0, d3.max(grafik_data, d => +d.amount)]);
    
    area_graph_group.select(".y.axis")
            .transition(t)
            .call(y_axis);
    area_graph_group.select(".x.axis")
        .transition(t)
        .call(x_axis);
    
    area_graph_group.select(".area path")
        .datum(grafik_data)
        .attr("d", area);
    area_graph_group.select(".line path")
        .datum(grafik_data)
        .attr("d", line);
    
    let circles = area_graph_group.select("g .circles")
        .selectAll("circle")
        .data(grafik_data);
    circles.transition(t)
        .attr("cx", d => x_scale(d.date))
        .attr("cy", d => y_scale(+d.amount))
        .attr("r", "2");
    circles.enter()
        .append("circle")
        .transition(t)
        .attr("cx", d => x_scale(d.date))
        .attr("cy", d => y_scale(+d.amount))
        .attr("r", "2");
    circles.exit()
        .transition(t)
        .remove();
}
function redraw_map() {
    set_amounts_by_region();
    preview_map_color.domain(d3.extent(d3.values(amounts_by_region)));
    d3.select("#preview_map")
        .selectAll("path")
        .transition(t)
        .attr("fill", function(d) {
            if (state_map.region == "375") {
                return preview_map_color(amounts_by_region[d.properties.subject]); 
            } else {
                return "white"; 
            }
        });
    d3.select("#minsk")
        .attr("fill", function(d) {
            if (state_map.region == "375") {
                return preview_map_color(amounts_by_region["170"]); 
            }   
        })
}
d3.csv("data/data.csv", function(data) {
    d3.json("data/preview_map.geojson", function(map_data) {
        initialize(data, map_data);
    });
});

