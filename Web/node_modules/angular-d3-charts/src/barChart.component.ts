import { Component, Input, Output, EventEmitter } from '@angular/core';
declare let d3: any;
declare let $: any;

@Component({
    selector: 'angular-d3-bar',
    template: `
    <div id="barChart">
    </div>
  `
})
export class BarChartComponent {
    @Input() public width: number;
    @Input() public height: number;
    @Input() public margin: any;
    @Input() public data: any;
    @Input() public transitionDuration: number;
    @Input() public transitionDelay: number;
    @Input() public barWidth: any;
    @Input() public yAxisd3Format: any;
    // @Input() public color: Array<any>;
    // @Input() public dataGroup: number;
    @Input() public yAxisTicks: number;
    @Input() public dataColumns = [3, 3];
    @Input() public alphaDistance: number;
    @Input() public xAxisOrientation: string;
    @Input() public yAxisOrientation: string;
    @Input() public chartID: string;
    @Input() public defaultMargin = {
        top: 20,
        right: 160,
        bottom: 35,
        left: 0
    };
    @Input() public colors: Array<any>;

    constructor() {
    }

    public ngOnInit() {
        this.renderChart();
    }

    public renderChart() {
        let margin = this.margin ? this.margin : this.defaultMargin;
        let width = this.width ? this.width : 400;
        let height = this.height ? this.height : 300;
        let xAxisOrientation = this.xAxisOrientation ? this.xAxisOrientation : 'bottom';
        let yAxisOrientation = this.yAxisOrientation ? this.yAxisOrientation : 'left';
        let columns = this.dataColumns ? this.dataColumns : [1];
        let colors = this.colors;
        let alphaDistance = this.alphaDistance ? this.alphaDistance : 0.6;
        let yAxisTicks = this.yAxisTicks ? this.yAxisTicks : 10;
        let barWidth = this.barWidth ? this.barWidth : '11px';
        let yAxisd3Format = this.yAxisd3Format ? this.yAxisd3Format : '.1S';
        let transitionDuration = this.transitionDuration ? this.transitionDuration : 1000;
        let transitionDelay = this.transitionDelay ? this.transitionDelay : 100;
        let chartID = this.chartID ? this.chartID : 'barChart';

        let fromLeft = 40;
        let svg = d3.select('#' + chartID)
            .append('svg')
            .attr('width', width)
            .attr('height', height + margin.top + margin.bottom + 2)
            .append('g')
            .attr('transform', 'translate(' + (margin.left + fromLeft) + ',' + margin.top + ')');

        let x0 = d3.scale.ordinal()
            .rangeRoundBands([0, width - 30], alphaDistance);

        let x1 = d3.scale.ordinal();

        let y = d3.scale.linear()
            .range([height, 0]);

        let xAxis = d3.svg.axis()
            .scale(x0)
            .orient(xAxisOrientation);

        let yAxis = d3.svg.axis()
            .scale(y)
            .orient(yAxisOrientation)
            .ticks(yAxisTicks)
            .tickFormat(d3.format(yAxisd3Format))
            .innerTickSize(-width)
            .tickPadding(10)

        let color = d3.scale.ordinal()
            .range(colors);

        let yBegins;

        let innerColumns = {};
        let count = 1;
        for (let i = 0; i < columns.length; i++) {
            innerColumns['column' + (i + 1)] = columns[i];
            let arr = [];
            for (let j = 0; j < columns[i]; j++) {
                let num = 'value' + count;
                count = count + 1;
                arr.push(num);
                innerColumns['column' + (i + 1)] = arr;
            }
        }

        let columnHeaders = d3.keys(this.data[0]).filter((key) => { return key !== 'day'; });
        color.domain(d3.keys(this.data[0]).filter((key) => { return key !== 'day'; }));
        this.data.forEach((d: any) => {
            let yColumn = new Array();
            d.columnDetails = columnHeaders.map((value) => {
                for (let ic in innerColumns) {
                    if ($.inArray(value, innerColumns[ic]) >= 0) {
                        if (!yColumn[ic]) {
                            yColumn[ic] = 0;
                        }
                        yBegins = yColumn[ic];
                        yColumn[ic] += +d[value];
                        return { name: value, column: ic, yBegin: yBegins, yEnd: +d[value] + yBegins, };
                    }
                }
            });
            d.total = d3.max(d.columnDetails, (d1) => {
                return d1 ? d1.yEnd : 0;
            });
        });

        x0.domain(this.data.map((d: any) => { return d.label; }));
        x1.domain(d3.keys(innerColumns)).rangeRoundBands([0, x0.rangeBand()]);

        y.domain([0, d3.max(this.data, (d) => {
            return d.total;
        })]);

        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);

        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.7em')
            .style('text-anchor', 'end')
            .text('');

        svg.selectAll('.y')
            .selectAll('path')
            .style('display', 'none');
        if (this.dataColumns.length == 1) {
            svg.selectAll(".x")
                .selectAll('text')
                .attr("x", function (d) { return -20; })
            // .attr("y", function (d) { return 6; })
        }
        let stackedbars = svg.selectAll('.project_stackedbar')
            .data(this.data)
            .enter().append('g')
            .attr('class', 'g')
            .attr('transform', (d) => { return 'translate(' + x0(d.label) + ',0)'; });
        stackedbars.selectAll('rect')
            .data((d) => { return d.columnDetails; })
            .enter().append('rect')
            .attr('width', x1.rangeBand())
            .attr('x', (d) => {
                return x1(d ? d.column : '');
            })
            .style('fill', (d) => {
                return d ? color(d.name) : '';
            })
            .attr('y', height - 1)
            .attr('height', 0)
            .attr('width', barWidth)
            .transition()
            .duration(transitionDuration)
            .delay(transitionDelay)
            .attr('y', (d) => {
                return y(d ? d.yEnd : 0);
            })
            .attr('height', (d) => {
                return y(d ? d.yBegin : 0) - y(d ? d.yEnd : 0);
            });
    }
    /* let valueArray = [];
    let dataGroup = this.dataGroup ? this.dataGroup + 1 : 2;
    for (let i = 1; i < dataGroup; i++) {
        valueArray.push('value' + i);
    }
    let chartComponent = this;
    let width = this.width ? this.width : 700;
    let height = this.height ? this.height : 400;
    let transitionDuration = this.transitionDuration ? this.transitionDuration : 1000;
    let transitionDelay = this.transitionDelay ? this.transitionDelay : 100;
    let radius = 250;
    let data = this.data;
    let margin = {
        top: 20,
        right: 160,
        bottom: 35,
        left: 0
    };
    let fromLeft = 40;
    let color = this.color ? this.color : ['blue'];
    let barWidth = this.barWidth ? this.barWidth : '11px';
    let yAxisd3Format = this.yAxisd3Format ? this.yAxisd3Format : '.1S';
    let yAxisTicks = this.yAxisTicks ? this.yAxisTicks : 10;
    
    let svg = d3.select('#barChart')
        .append('svg')
        .attr('width', width + 100)
        .attr('height', height + margin.top + margin.bottom + 2)
        .append('g')
        .attr('transform', 'translate(' + (margin.left + fromLeft) + ',' + margin.top + ')');

    let dataset = d3.layout.stack()(valueArray.map((value) => {
        return data.map((d: any) => {
            return { x: d.label, y: d.value };
        });
    }));

    let x = d3.scale.ordinal()
        .domain(dataset[0].map((d) => { return d.x; }))
        .rangeBands([0, width], 1);

    let y = d3.scale.linear()
        .domain([0, d3.max(dataset, (d) => {
            return d3.max(d, (d1) => { return d1.y0 + d1.y; });
        })])
        .range([height, 0]);

    let yAxis = d3.svg.axis()
        .scale(y)
        .orient('left')
        .ticks(yAxisTicks)
        .tickSize(-width, 0, 0)
        .tickFormat(d3.format(yAxisd3Format));

    let xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom');

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    svg.selectAll('.x')
        .selectAll('text');

    svg.selectAll('.y')
        .selectAll('path')
        .style('display', 'none');

    let groups = svg.selectAll('g.cost')
        .data(dataset)
        .enter().append('g')
        .attr('class', 'cost')
        .style('fill', (d, i) => { return color[i]; });
    let rect = groups.selectAll('rect')
        .data((d) => { return d; })
        .enter()
        .append('rect')
        .attr('x', (d) => { return x(d.x); })
        .attr('y', height - 1)
        .attr('height', 0)
        .attr('width', barWidth)
        .transition()
        .duration(transitionDuration)
        .delay(transitionDelay)
        .attr('y', (d) => { return y(d.y0 + d.y); })
        .attr('height', (d) => { return y(d.y0) - y(d.y0 + d.y); });
} */
}