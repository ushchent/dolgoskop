// Ключи объекта не должны быть целыми числами. Только строковые. Вот так.
// Все равно при указании ключей "1", "2", "3" ... консоль FF выдает 1 empty slot. Chomium молчит. Замена ключей на двузначные цифры "11", "22" ... или на нумерацию с "0", "1", ... решает проблему. В чем дело - непонятно.

// Задавать размеры SVG в коде необязательно. https://css-tricks.com/scale-svg/
// Aspect ratio - соотношение ширины и высоты картинки. 16:9, например. Только
// для SVG указываются 4 числа: x, y, width, height
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
    "3": "Просроченная дебиторская задолженность",
    "4": "Дебиторская задолженность"
};
const areas_map = {
    1: "Cтроительство",
    2: "Информация и связь",
    3: "Операции с недвижимым имуществом",
    4: "Промышленность",
    5: "Образование",
    6: "Оптовая и розничная торговля; ремонт автомобилей и мотоциклов",
    7: "Сельское, лесное и рыбное хозяйство"
}
// Действительная ширина svg-блока.
var main = d3.select("main");
var menu = main.append("div")
			.attr("id", "menu");
var svg_area = main.append("div")
				.attr("id", "svg_area");

// Определяем ширину блока:
svg_width = d3.select("#svg_area").node().getBoundingClientRect().width;

var table = main.append("table");

var svg_width;
var y_scale = d3.scaleLinear()
				.range([280, 10]);
var x_scale = d3.scaleBand()
				.range([0, svg_width]);

var table = d3.select("#table").append("table");
var caption = table.append("caption");
var thead = table.append("thead");
var tbody = table.append("tbody");

var line = d3.line()
			.x(function(d) {
                return x_scale(d.year) + 60 + x_scale.bandwidth() / 2;
            })
			.y(function(d) { return y_scale(+d.amt); });

var area = d3.area()
			.x(function(d) {
                return x_scale(d.year) + 60 + x_scale.bandwidth() / 2;
            })
			.y0(280)
			.y1(function(d) { return y_scale(+d.amt); });

function create_selectors(regional_data) {
	let region_codes = Array.from(new Set(regional_data.map(function(d) {
		return d.region
	})));
	let indicator_codes = Array.from(new Set(regional_data.map(function(d) {
		return d.ind;
	})));
	menu.append("select")
		.attr("id", "region_selector")
		.selectAll("option")
		.data(region_codes)
		.enter()
		.append("option")
		.text(function(d) { return regions_map[d] })
	menu.append("select")
		.attr("id", "indicator_selector")
		.selectAll("option")
		.data(indicator_codes)
		.enter()
		.append("option")
		.text(function(d) { return indicators_map[d] })
}

function redraw() {
	
// Задаем диапазон шкал x и y
	x_scale.domain([regional_data.map(function(d) { return d["date"]; })]);
	y_scale.domain([]);
}

d3.csv("data/data.csv", function(data) {

// Преобразуем строковые даты в настоящие и сортируем по возрастанию даты.
    data.forEach(function(d, i) {
            data[i]["date"] = new Date(d["date"]);
        });
	data.sort(function(a, b) { return a["date"] - b["date"]; });
	console.log(data);


// Фильтруем список, забираем данные только по всем видам деятельности (код 0)
    let regional_data = data.filter(function(d) {
            return d.type == 0;
        });
// Создаем селекторы для меню
	create_selectors(regional_data);
var grafik = svg_area.append("svg")
				.attr("class", "grafik")
				.attr("viewbox", "0 0 800 3000")
				.attr("preserveAspectRatio", "xMidYMid meet")

let dates_range = Array.from(new Set(data.map(function(d) {
		return d["date"];
	})));

	x_scale.domain([dates_range[0], dates_range[dates_range.length - 1]]);
//var karta = svg_area.append("svg")
//				.attr("class", "karta")
//				.attr("viewbox", "0 0 1000 300")
//				.attr("preserveAspectRatio", "xMidYMid meet")
//    console.log(regional_data)
});

