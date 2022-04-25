//Desarrollo de las visualizaciones
import * as d3 from 'd3';
import { numberWithCommas3 } from '../helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from '../modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C',
COLOR_COMP_1 = '#528FAD', 
COLOR_COMP_2 = '#AADCE0',
COLOR_ANAG_PRIM_1 = '#BA9D5F', 
COLOR_ANAG_PRIM_2 = '#9E6C51',
COLOR_ANAG_COMP_1 = '#1C5A5E';
let tooltip = d3.select('#tooltip');

//Diccionario
let dictionary = {
    0: '16-24',
    1: '25-34',
    2: '35-44',
    3: '45-54',
    4: '55-64',
    5: '65+'
};

export function initChart(iframe) {
    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_economia_3_3/main/data/distribucion_poblacion_ocupada_1970_2020_v2.csv', function(error,data) {
        if (error) throw error;

        //Declaramos fuera las variables genéricas
        let margin = {top: 20, right: 20, bottom: 20, left: 35},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#chart")
            .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        let gruposEdad = ['16-24','25-34','35-44','45-54','55-64','65+'];

        let x = d3.scaleBand()
            .domain(d3.map(data, function(d){ return d.periodo; }).keys())
            .range([0, width])
            .padding(0.2);

        let xAxis = function(svg) {
            svg.call(d3.axisBottom(x));
            svg.call(function(g){g.selectAll('.tick line').remove()});
            svg.call(function(g){g.selectAll('.domain').remove()});
        }
        
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        
        let y = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        let yAxis = function(svg) {
            svg.call(d3.axisLeft(y).ticks(5).tickFormat(function(d,i) { return numberWithCommas3(d); }));
            svg.call(function(g) {
                g.call(function(g){
                    g.selectAll('.tick line')
                        .attr('class', function(d,i) {
                            if (d == 0) {
                                return 'line-special';
                            }
                        })
                        .attr('x1', '0%')
                        .attr('x2', `${width}`)
                });
            });
        }

        svg.append("g")
            .attr("class", "yaxis")
            .call(yAxis);

        let color = d3.scaleOrdinal()
            .domain(gruposEdad)
            .range([COLOR_PRIMARY_1, COLOR_ANAG_PRIM_1, COLOR_COMP_2, COLOR_COMP_1, COLOR_ANAG_COMP_1, COLOR_ANAG_PRIM_2]);

        let stackedDataEdad = d3.stack()
            .keys(gruposEdad)
            (data);

        function init() {
            svg.append("g")
                .attr('class','chart-g')
                .selectAll("g")
                .data(stackedDataEdad)
                .enter()
                .append("g")
                .attr("fill", function(d) { return color(d.key); })
                .attr("class", function(d,i) {
                    return 'serie serie-' + i;
                })
                .selectAll("rect")
                .data(function(d) { return d; })
                .enter()
                .append("rect")
                .attr('class','rect')
                .attr("x", function(d) { return x(d.data.periodo) + x.bandwidth() / 4; })
                .attr("y", function(d) { return y(0); })
                .attr("height", function(d) { return 0; })
                .attr("width",x.bandwidth() / 2)
                .on('mouseover', function(d,i,e) {
                    //Opacidad en barras
                    let bars = svg.selectAll('.rect');
                    let parentElem = svg.select(`.${this.parentNode.classList.value.split(' ')[1]}`);
                    let childElems = parentElem.selectAll('.rect');            
            
                    bars.each(function() {
                        this.style.opacity = '0.4';
                    });
                    childElems.each(function() {
                        this.style.opacity = '1';
                    });

                    //Tooltip
                    let currentType = this.parentNode.classList.value.split(' ')[1];
                    let html = '<p class="chart__tooltip--title">' + dictionary[currentType.split('-')[1]] + ' (' + d.data.periodo + ')</p>' + 
                            '<p class="chart__tooltip--text">Este grupo de edad representa un <b>' + numberWithCommas3(d.data[dictionary[currentType.split('-')[1]]]) + '%</b> de la población total ocupada para este año</p>';
                    
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d,i,e) {
                    //Opacidad
                    let bars = svg.selectAll('.rect');
                    bars.each(function() {
                        this.style.opacity = '1';
                    });

                    //Quitamos el tooltip
                    getOutTooltip(tooltip);
                })
                .transition()
                .duration(2000)
                .attr("y", function(d) { return y(d[1]); })
                .attr("height", function(d) { return y(d[0]) - y(d[1]); });
        }

        function animateChart() {
            svg.selectAll('.rect')
                .attr("x", function(d) { return x(d.data.periodo) + x.bandwidth() / 4; })
                .attr("y", function(d) { return y(0); })
                .attr("height", function(d) { return 0; })
                .attr("width", x.bandwidth() / 2)
                .transition()
                .duration(2000)
                .attr("y", function(d) { return y(d[1]); })
                .attr("height", function(d) { return y(d[0]) - y(d[1]); });
        }

        //////
        ///// Resto - Chart
        //////
        init();

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();
        });

        //////
        ///// Resto
        //////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_economia_3_3','evolucion_poblacion_ocupada');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('evolucion_poblacion_ocupada');

        //Captura de pantalla de la visualización
        setChartCanvas();        

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('evolucion_poblacion_ocupada');
        });

        //Altura del frame
        setChartHeight(iframe);
    });    
}