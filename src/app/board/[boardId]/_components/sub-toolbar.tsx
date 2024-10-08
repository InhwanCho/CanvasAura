import React from 'react'
import {SketchPicker} from 'react-color';

export default function SubToolbar() {
  return (
    <div className="absolute top-1/3 right-2 p-3 flex items-center">
      <SketchPicker />
    </div>
  )
}
