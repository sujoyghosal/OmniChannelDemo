"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var BarChartComponent = (function () {
    function BarChartComponent() {
        this.dataColumns = [3, 3];
        this.defaultMargin = {
            top: 20,
            right: 160,
            bottom: 35,
            left: 0
        };
    }
    BarChartComponent.prototype.ngOnInit = function () {
        this.renderChart();
    };
    BarChartComponent.prototype.renderChart = function () {
        var margin = this.margin ? this.margin : this.defaultMargin;
        var width = this.width ? this.width : 400;
        var height = this.height ? this.height : 300;
        var xAxisOrientation = this.xAxisOrientation ? this.xAxisOrientation : 'bottom';
        var yAxisOrientation = this.yAxisOrientation ? this.yAxisOrientation : 'left';
        var columns = this.dataColumns ? this.dataColumns : [1];
        var colors = this.colors;
        var alphaDistance = this.alphaDistance ? this.alphaDistance : 0.6;
        var yAxisTicks = this.yAxisTicks ? this.yAxisTicks : 10;
        var barWidth = this.barWidth ? this.barWidth : '11px';
        var yAxisd3Format = this.yAxisd3Format ? this.yAxisd3Format : '.1S';
        var transitionDuration = this.transitionDuration ? this.transitionDuration : 1000;
        var transitionDelay = this.transitionDelay ? this.transitionDelay : 100;
        var chartID = this.chartID ? this.chartID : 'barChart';
        var fromLeft = 40;
        var svg = d3.select('#' + chartID)
            .append('svg')
            .attr('width', width)
            .attr('height', height + margin.top + margin.bottom + 2)
            .append('g')
            .attr('transform', 'translate(' + (margin.left + fromLeft) + ',' + margin.top + ')');
        var x0 = d3.scale.ordinal()
            .rangeRoundBands([0, width - 30], alphaDistance);
        var x1 = d3.scale.ordinal();
        var y = d3.scale.linear()
            .range([height, 0]);
        var xAxis = d3.svg.axis()
            .scale(x0)
            .orient(xAxisOrientation);
        var yAxis = d3.svg.axis()
            .scale(y)
            .orient(yAxisOrientation)
            .ticks(yAxisTicks)
            .tickFormat(d3.format(yAxisd3Format))
            .innerTickSize(-width)
            .tickPadding(10);
        var color = d3.scale.ordinal()
            .range(colors);
        var yBegins;
        var innerColumns = {};
        var count = 1;
        for (var i = 0; i < columns.length; i++) {
            innerColumns['column' + (i + 1)] = columns[i];
            var arr = [];
            for (var j = 0; j < columns[i]; j++) {
                var num = 'value' + count;
                count = count + 1;
                arr.push(num);
                innerColumns['column' + (i + 1)] = arr;
            }
        }
        var columnHeaders = d3.keys(this.data[0]).filter(function (key) { return key !== 'day'; });
        color.domain(d3.keys(this.data[0]).filter(function (key) { return key !== 'day'; }));
        this.data.forEach(function (d) {
            var yColumn = new Array();
            d.columnDetails = columnHeaders.map(function (value) {
                for (var ic in innerColumns) {
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
            d.total = d3.max(d.columnDetails, function (d1) {
                return d1 ? d1.yEnd : 0;
            });
        });
        x0.domain(this.data.map(function (d) { return d.label; }));
        x1.domain(d3.keys(innerColumns)).rangeRoundBands([0, x0.rangeBand()]);
        y.domain([0, d3.max(this.data, function (d) {
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
                .attr("x", function (d) { return -20; });
        }
        var stackedbars = svg.selectAll('.project_stackedbar')
            .data(this.data)
            .enter().append('g')
            .attr('class', 'g')
            .attr('transform', function (d) { return 'translate(' + x0(d.label) + ',0)'; });
        stackedbars.selectAll('rect')
            .data(function (d) { return d.columnDetails; })
            .enter().append('rect')
            .attr('width', x1.rangeBand())
            .attr('x', function (d) {
            return x1(d ? d.column : '');
        })
            .style('fill', function (d) {
            return d ? color(d.name) : '';
        })
            .attr('y', height - 1)
            .attr('height', 0)
            .attr('width', barWidth)
            .transition()
            .duration(transitionDuration)
            .delay(transitionDelay)
            .attr('y', function (d) {
            return y(d ? d.yEnd : 0);
        })
            .attr('height', function (d) {
            return y(d ? d.yBegin : 0) - y(d ? d.yEnd : 0);
        });
    };
    __decorate([
        core_1.Input(),
        __metadata("design:type", Number)
    ], BarChartComponent.prototype, "width", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Number)
    ], BarChartComponent.prototype, "height", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Object)
    ], BarChartComponent.prototype, "margin", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Object)
    ], BarChartComponent.prototype, "data", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Number)
    ], BarChartComponent.prototype, "transitionDuration", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Number)
    ], BarChartComponent.prototype, "transitionDelay", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Object)
    ], BarChartComponent.prototype, "barWidth", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Object)
    ], BarChartComponent.prototype, "yAxisd3Format", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Number)
    ], BarChartComponent.prototype, "yAxisTicks", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Object)
    ], BarChartComponent.prototype, "dataColumns", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Number)
    ], BarChartComponent.prototype, "alphaDistance", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", String)
    ], BarChartComponent.prototype, "xAxisOrientation", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", String)
    ], BarChartComponent.prototype, "yAxisOrientation", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", String)
    ], BarChartComponent.prototype, "chartID", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Object)
    ], BarChartComponent.prototype, "defaultMargin", void 0);
    __decorate([
        core_1.Input(),
        __metadata("design:type", Array)
    ], BarChartComponent.prototype, "colors", void 0);
    BarChartComponent = __decorate([
        core_1.Component({
            selector: 'angular-d3-bar',
            template: "\n    <div id=\"barChart\">\n    </div>\n  "
        }),
        __metadata("design:paramtypes", [])
    ], BarChartComponent);
    return BarChartComponent;
}());
exports.BarChartComponent = BarChartComponent;
