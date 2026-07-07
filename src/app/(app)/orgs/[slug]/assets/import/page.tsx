import { ChangeEvent, useState } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'

function FileUploadInput() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      setSelectedFile(selectedFiles.item(0))
    }
  }
  const onFileUpload = () => {
    console.log(selectedFile?.name)
  }
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

  return (
    <div>
      <h1>GeeksforGeeks</h1>
      <h3>File Upload using React!</h3>
      <div>
        <input type="file" onChange={onFileChange} />
        <button onClick={onFileUpload}>Upload!</button>
      </div>
      {fileData()}
    </div>
  )
}

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Import assets"
        description="Upload a CSV file to register a batch of assets"
      />

      <FileUploadInput />
    </>
  )
}
