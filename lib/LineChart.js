import React from 'react';
import debounce from 'lodash.debounce';
import update from 'immutability-helper';
import { requireNativeComponent } from 'react-native';
import { largestTriangleThreeBucket } from 'd3fc-sample';

import BarLineChartBase from './BarLineChartBase';
import { lineData } from './ChartDataConfig';
import MoveEnhancer from './MoveEnhancer'
import ScaleEnhancer from "./ScaleEnhancer";
import HighlightEnhancer from "./HighlightEnhancer";
import ScrollEnhancer from "./ScrollEnhancer";

const sampler = largestTriangleThreeBucket()

class LineChart extends React.Component {
  constructor(props) {
    super(props)

    this.handlGraphChange = this.handlGraphChange.bind(this)
    this.handleDebounce = debounce(this.calculateUpdatedData, 500)
    this.nativeComponentRef = null

    this.state = {
      currentScale: 1
    }
  }

  getNativeComponentName() {
    return 'RNLineChart'
  }

  getNativeComponentRef() {
    return this.nativeComponentRef
  }

  currentlyShowedData(arr, min, max) {
    let sum = 0, totalFiltered = []

    arr.forEach(data => {
      let filtered = data.values.filter(x => x.x > min && x.x < max),
        newObj = update(data, { $merge: { ...data, values: filtered } })

      sum += filtered.length
      totalFiltered.push(newObj)
    })

    return [sum, totalFiltered]
  }


  handlGraphChange(event) { this.handleDebounce(event.nativeEvent) }

  calculateUpdatedData(graphInfo) {
    let scale = parseInt(graphInfo.scaleX)
    if (this.state.currentScale != scale) {
      let totalData = this.currentlyShowedData(this.state.originalData, parseInt(graphInfo.left), parseInt(graphInfo.right))

      if (totalData[0] > 1000) {
        this.nativeComponentRef.fitScreen()
        let sampledData = []

        totalData[1].forEach(data => {
          let obj = data
          let reducedValues = this.downsampleData(data.values)

          let newobj = update(obj, { $merge: { ...obj, values: reducedValues } })
          sampledData.push(newobj)
        })

        console.log(sampledData)

        // this.setState(update(this.state, {
        //   graphData: { $set: sampledData },
        //   isUpdate: { $set: true },
        //   currentScale: { $set: scale },
        // }))
      }
    }
  }

  downsampleData(originalValues) {
    if (originalValues.length > LIMIT) {
      let sampledArray = []

      sampledArray = dataSampler(originalValues)

      while (sampledArray.length > LIMIT)
        if (sampledArray.length > LIMIT)
          sampledArray = this.dataSampler(sampledArray)

      return sampledArray
    }

    return originalValues
  }

  dataSampler(arr) {
    sampler.x(d => d.x).y(d => d.y)
    sampler.bucketSize(2)

    return sampler(arr)
  }

  render() {
    return (
      <RNLineChart
        {...this.props}
        ref={ref => this.nativeComponentRef = ref}
        onChange={this.handlGraphChange}
      />

    )
  }
}

LineChart.propTypes = {
  ...BarLineChartBase.propTypes,

  data: lineData,
};

var RNLineChart = requireNativeComponent('RNLineChart', LineChart, {
  nativeOnly: { onSelect: true, onChange: true }
});

export default ScrollEnhancer(HighlightEnhancer(ScaleEnhancer(MoveEnhancer(LineChart))))
