'use client'

import Papa from 'papaparse'
import { ChangeEvent, useState } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'

// we referred to the code from this site:
//   https://www.geeksforgeeks.org/reactjs/file-uploading-in-react-js/

function FileUploadInput() {
  // useState<File | null>
  //   keep track of the file selected by the user. since a file may
  //   or may not be selected, we indicate the type is File | null.
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // event handler for when the selected file changes. when the file
  // changes, update the state using the first file selected, if any.
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      setSelectedFile(selectedFiles.item(0))
    }
  }

  // event handler for when a file is uploaded. for now, we're just
  // displaying the name of the selected file onto the console.
  const onFileUpload = () => {
    if (selectedFile) {
      Papa.parse(selectedFile, {
        complete: function (result) {
          console.log(result)
        },
      })
    }
  }

  // a component to render the file data. if a file was selected,
  // then display some details about the file. otherwise, display
  // a message.
  const fileData = () => {
    if (selectedFile) {
      return (
        <div>
          <h2>File Details:</h2>
          <p>File Name: {selectedFile.name}</p>
          <p>File Type: {selectedFile.type}</p>
          <p>Last Modified: {selectedFile.lastModified.toString()}</p>
        </div>
      )
    } else {
      return (
        <div>
          <br />
          <h4>Choose before Pressing the Upload button</h4>
        </div>
      )
    }
  }

  // the JSX being returned from this component. it's a button to
  // select files and another button to upload the files selected.
  return (
    <div>
      <h1>GeeksforGeeks</h1>
      <h3>File Upload using React!</h3>
      <div>
        {/* NOTICE: we aren't calling onFileChange nor onFileUpload.
          we're passing them into the elements. React will call 
          the functions when it needs to. */}
        <input type="file" onChange={onFileChange} />
        <button onClick={onFileUpload}>Upload!</button>
      </div>
      {/* NOTICE: here we call fileData() since it returns JSX */}
      {fileData()}
    </div>
  )
}

export default function ImportPage() {
  return (
    // NOTICE: we wrap <PageHeader /> and <FileUploadInput /> in
    // a fragment </> since components must return at most one
    // element.
    <>
      <PageHeader title="Import Assets" description="Upload a CSV file to import assets." />
      <FileUploadInput />
    </>
  )
}
