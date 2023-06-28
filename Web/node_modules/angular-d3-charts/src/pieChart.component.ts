import { Component, Input, Output, EventEmitter } from '@angular/core';
declare let d3: any;
declare let $: any;

@Component({
    selector: 'angular-d3-pie',
    template: `
    <div id="pieChart">
    </div>
  `
})
export class PieChartComponent {
    @Input() public width: number;
    @Input() public height: number;
    @Input() public iconWidth: number;
    @Input() public iconHeight: number;
    @Input() public data: any;
    @Input() public spreadSlice: boolean;
    @Input() public outerRadius: number;
    @Input() public chartID: string;

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
        let chartID = this.chartID ? this.chartID : 'pieChart';
        this.outerRadius > 150 ? this.outerRadius = 150 : this.outerRadius;
        let pie = d3.layout.pie()
            .startAngle(Math.PI / 2)
            .endAngle(Math.PI * 2 + Math.PI / 2)
            .value((d) => {
                return d.value;
            }).sort(null);

        let arc = d3.svg.arc()
            .outerRadius(this.outerRadius)

        let arcNew = d3.svg.arc()
            .outerRadius(this.outerRadius + 10)

        let svg = d3.select('#' + chartID).append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + (400 - radius + 10) + ',' + (400 - radius + 10) + ')');

        let g = svg.selectAll('.arc')
            .data(pie(piedata))
            .enter().append('g')
            .attr('class', 'arc');

        g.append('path')
            .attr('d', arc)
            .style('stroke', 'white').style('fill', function (d, i) {
                return [d.data.color];
            })
            .attr('id', function (d) {
                return 'iconId' + d.data.event;
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
                let multiplicationFactor = 9;
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