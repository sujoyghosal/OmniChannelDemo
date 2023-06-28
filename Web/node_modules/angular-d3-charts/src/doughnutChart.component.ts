import { Component, Input, Output, EventEmitter } from '@angular/core';
declare let d3: any;
declare let $: any;

@Component({
    selector: 'angular-d3-donut',
    template: `
    <div id="donutChart">
    </div>
  `
})
export class DoughnutChartComponent {
    @Input() public width: number;
    @Input() public height: number;
    @Input() public iconWidth: number;
    @Input() public iconHeight: number;
    @Input() public outerRadius: number;
    @Input() public innerRadius: number;
    @Input() public data: any;
    @Input() public centerImage: any;
    @Input() public spreadSlice: boolean;
    @Input() public chartID: string;
    @Input() public middleText: string;
    @Input() public middleTextColor: string;
    @Input() public middleTextFontSize: string;
    @Output() public centerImageEvent = new EventEmitter();
    constructor() {
    }

    public ngOnInit() {
        this.renderChart();
    }

    public renderChart() {
        let chartComponent = this;
        let imageWidth = this.iconWidth ? this.iconWidth : 40;
        let imageHeight = this.iconHeight ? this.iconHeight : 40;
        let width = this.width ? this.width : 700;
        let height = this.height ? this.height : 400;
        let radius = 250;
        let piedata = this.data;
        this.outerRadius = this.outerRadius ? this.outerRadius : 150;
        this.innerRadius = this.innerRadius ? this.innerRadius : 70;
        this.spreadSlice = this.spreadSlice ? this.spreadSlice : false;
        let chartID = this.chartID ? this.chartID : 'donutChart';
        let middleText = this.middleText ? this.middleText : '';
        let middleTextColor = this.middleTextColor ? this.middleTextColor : 'black';
        let middleTextFontSize = this.middleTextFontSize ? this.middleTextFontSize : '1em';
        this.outerRadius > 150 ? this.outerRadius = 150 : this.outerRadius;
        let pie = d3.layout.pie()
            .startAngle(Math.PI / 2)
            .endAngle(Math.PI * 2 + Math.PI / 2)
            .value((d) => {
                return d.value;
            }).sort(null);

        let arc = d3.svg.arc()
            .outerRadius(this.outerRadius)
            .innerRadius(this.innerRadius);

        let arcNew = d3.svg.arc()
            .outerRadius(this.outerRadius + 10)
            .innerRadius(this.innerRadius);

        let svg = d3.select('#' + chartID).append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + (400 - radius + 10) + ',' + (400 - radius + 10) + ')');

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr('font-size', middleTextFontSize)
            .style('fill', middleTextColor)
            .text(middleText);

        let g = svg.selectAll('.arc')
            .data(pie(piedata))
            .enter().append('g')
            .attr('class', 'arc');

        /* g.append("text")
            .attr("transform", function (d) {
                var _d = arc.centroid(d);
                _d[0] *= 1.3;	//multiply by a constant factor
                _d[1] *= 1.3;	//multiply by a constant factor
                return "translate(" + _d + ")";
            })
            .attr("dy", ".50em")
            .style("text-anchor", "middle")
            .text(function (d) {
                return d.data.label
            }); */

        g.append('path')
            .attr('d', arc)
            .style('stroke', 'white').style('fill', function (d, i) {
                return d.data.color;
            })
            .attr('id', function (d) {
                return 'iconId' + d.data.id;
            })
            .attr('cursor', this.spreadSlice ? 'pointer' : 'default')
            .on('click', function (d) {
                d3.selectAll('path').transition()
                    .duration(50)
                    .attr('d', function (d) {
                        if (this.selectedId === d.data.id) {
                            d.data.expanded = true;
                            this.selectedId = null;
                            return arc(d);
                        } else {
                            d.data.expanded = false;
                            this.selectedId = null;
                            return arc(d);
                        }
                    })
                if (chartComponent.spreadSlice) {
                    d3.select(this).transition()
                        .duration(50)
                        .attr('d', function (d) {
                            if (d.data.expanded) {
                                this.selectedId = null;
                                d.data.expanded = false;
                                return arc(d);
                            } else {
                                d.data.expanded = true;
                                this.selectedId = d.data.id;
                                return arcNew(d);
                            }
                        });
                }
            });

        g.append('g')
            .attr('transform', function (d) {
                return 'translate(' + arc.centroid(d) + ')';
            })
            .append('svg:image')
            .attr('xlink:href', function (d) {
                return d.data.iconImage;
            })
            .attr('id', function (d) {
                return d.data.id;
            })
            .attr('width', imageWidth)
            .attr('height', imageHeight)
            .attr('x', -1 * imageWidth / 2)
            .attr('y', -1 * imageHeight / 2)
            .attr('cursor', this.spreadSlice ? 'pointer' : 'default')
            .on('click', function (d) {
                d3.selectAll('path').transition()
                    .duration(50)
                    .attr('d', function (d) {
                        if (this.selectedId == d.data.id) {
                            d.data.expanded = true;
                            this.selectedId = null;
                            return arc(d);
                        } else {
                            d.data.expanded = false;
                            this.selectedId = null;
                            return arc(d);
                        }
                    });
                if (chartComponent.spreadSlice) {
                    d3.select('path#iconId' + d.data.id).transition()
                        .duration(50)
                        .attr('d', function (d) {
                            if (d.data.expanded) {
                                this.selectedId = null;
                                d.data.expanded = false;
                                return arc(d);
                            } else {
                                d.data.expanded = true;
                                this.selectedId = d.data.id;
                                return arcNew(d);
                            }
                        });
                }
            });
        if (this.centerImage) {
            svg.append('svg:image')
                .attr('id', 'center_image')
                .attr('x', -60)
                .attr('y', -60)
                .attr('width', 120)
                .attr('height', 120)
                .attr('cursor', 'pointer')
                .attr('xlink:href', this.centerImage)
                .on('click', function click(d) {
                    chartComponent.centerImageEvent.emit()
                });
        }

        var legendLabels = [];
        var legendColors = [];
        for (let i = 0; i < piedata.length; i++) {
            legendLabels.push(piedata[i].label);
            legendColors.push(piedata[i].color);
        }
        var color = d3.scale.ordinal()
            .domain(legendLabels)
            .range(legendColors);
        var legendItemSize = 18
        var legendSpacing = 4

        var legend = svg
            .selectAll('.legend')
            .data(color.domain())
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => {
                let outerRadiusCircle: any = this.outerRadius;
                let multiplicationFactor = outerRadiusCircle > 100 ? (outerRadiusCircle < 130 ? 8 : 9) : 6
                var height = legendItemSize + legendSpacing;
                var offset = height * color.domain().length / 2;
                var x = legendItemSize * multiplicationFactor;
                var y = ((i * height) - offset);
                return `translate(${x}, ${y})`
            })

        legend
            .append('rect')
            .attr('width', legendItemSize)
            .attr('height', legendItemSize)
            .style('fill', color);

        legend
            .append('text')
            .attr('x', legendItemSize + legendSpacing)
            .attr('y', legendItemSize - legendSpacing)
            .text((d) => d)
    }
}