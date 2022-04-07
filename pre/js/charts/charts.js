//Desarrollo de las visualizaciones
import * as d3 from 'd3';
//import { numberWithCommas2 } from './helpers';
//import { getInTooltip, getOutTooltip, positionTooltip } from './modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage, setCustomCanvas, setChartCustomCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C', 
COLOR_PRIMARY_2 = '#E37A42', 
COLOR_ANAG_1 = '#D1834F', 
COLOR_ANAG_2 = '#BF2727', 
COLOR_COMP_1 = '#528FAD', 
COLOR_COMP_2 = '#AADCE0', 
COLOR_GREY_1 = '#B5ABA4', 
COLOR_GREY_2 = '#64605A', 
COLOR_OTHER_1 = '#B58753', 
COLOR_OTHER_2 = '#731854';

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
            .padding([0.2]);

        let xAxis = d3.axisBottom(x);
        
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        
        let y = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        svg.append("g")
            .attr("class", "yaxis")
            .call(d3.axisLeft(y));

        let color = d3.scaleOrdinal()
            .domain(gruposEdad)
            .range([COLOR_PRIMARY_1, COLOR_COMP_2, COLOR_COMP_1, COLOR_GREY_1, COLOR_OTHER_1, COLOR_OTHER_2]);

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
                .selectAll("rect")
                .data(function(d) { return d; })
                .enter()
                .append("rect")
                    .attr('class','prueba')
                    .attr("x", function(d) { return x(d.data.periodo) + x.bandwidth() / 4; })
                    .attr("y", function(d) { return y(0); })
                    .attr("height", function(d) { return 0; })
                    .attr("width",x.bandwidth() / 2)
                    .transition()
                    .duration(2500)
                    .attr("y", function(d) { return y(d[1]); })
                    .attr("height", function(d) { return y(d[0]) - y(d[1]); });
        }

        function animateChart() {
            svg.selectAll('.prueba')
                .attr("x", function(d) { return x(d.data.periodo); })
                .attr("y", function(d) { return y(0); })
                .attr("height", function(d) { return 0; })
                .attr("width", x.bandwidth())
                .transition()
                .duration(2500)
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
        //setChartCanvas();
        setTimeout(() => {
            setCustomCanvas();
        }, 6000);        

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            //setChartCanvasImage('evolucion_poblacion_ocupada');
            setChartCustomCanvasImage('evolucion_poblacion_ocupada');
        });

        //Altura del frame
        setChartHeight(iframe);
    });    
}