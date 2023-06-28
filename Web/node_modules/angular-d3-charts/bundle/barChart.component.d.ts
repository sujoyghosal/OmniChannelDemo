export declare class BarChartComponent {
    width: number;
    height: number;
    margin: any;
    data: any;
    transitionDuration: number;
    transitionDelay: number;
    barWidth: any;
    yAxisd3Format: any;
    yAxisTicks: number;
    dataColumns: number[];
    alphaDistance: number;
    xAxisOrientation: string;
    yAxisOrientation: string;
    chartID: string;
    defaultMargin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    colors: Array<any>;
    constructor();
    ngOnInit(): void;
    renderChart(): void;
}
