import { Panel } from '../components/Panels';

interface CalcProps {
    kwh: number,
    panel: Panel,
    month_01: number,
    month_02: number,
    month_03: number,
    month_04: number,
    month_05: number,
    month_06: number,
    month_07: number,
    month_08: number,
    month_09: number,
    month_10: number,
    month_11: number,
    month_12: number,
    month_13: number,
    averageIncrease: number,
    roofOrientation: number,
    discount: number,
    increase: number,
    percent: boolean,
    inversorAmount: number,
}

export async function Calculate(props: CalcProps) {
    // Average
    const sum = props.month_01
        + props.month_02
        + props.month_03
        + props.month_04
        + props.month_05
        + props.month_06
        + props.month_07
        + props.month_08
        + props.month_09
        + props.month_10
        + props.month_11
        + props.month_12
        + props.month_13;

    const monthsAverageKwh = sum / 13;

    // Final average
    const finalAverageKwh = monthsAverageKwh + props.averageIncrease;

    // Monthly and yearly paid
    const monthlyPaid = finalAverageKwh * props.kwh;
    const yearlyPaid = monthlyPaid * 12;

    // System capacity Wp
    const systemCapacityWp = finalAverageKwh / props.roofOrientation;

    const foundCapacity = props.panel.prices.find(price => { return systemCapacityWp <= price.potency });

    if (!foundCapacity) {
        return undefined;
    }


}