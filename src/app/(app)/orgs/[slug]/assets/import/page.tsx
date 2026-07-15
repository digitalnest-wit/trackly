'use client'

import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { ChangeEvent, useState } from 'react'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type WizardStep =
  | 'file_select'
  | 'column_mapping'
  | 'schema_validate'
  | 'resolving_refs'
  | 'db_insert'

function CurrentWizardStep() {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [wizardStep, setWizardStep] = useState<WizardStep>('file_select')

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      setSelectedFile(selectedFiles.item(0))
    }
  }
  const handleFileUpload = () => {
    if (selectedFile) {
      Papa.parse(selectedFile, {
        complete: function (result) {
          console.log(result)
        },
      })
      setWizardStep('column_mapping')
    }
  }

  switch (wizardStep) {
    case 'file_select':
      return (
        <>
          <Button variant={'secondary'} onClick={router.back}>
            Cancel
          </Button>
          {selectedFile && (
            <div className="my-1 flex gap-1">
              <span className="text-secondary-foreground my-1">
                Selected File <strong>{selectedFile.name}</strong>
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Input type="file" accept="file/csv" onChange={handleFileChange} />
            <Button disabled={selectedFile === null} onClick={handleFileUpload}>
              Next
            </Button>
          </div>
        </>
      )
    case 'column_mapping':
      return <p>TODO: Mapping columns</p>
    case 'schema_validate':
      return <p>TODO: Validate Schema</p>
    case 'resolving_refs':
      return <p>TODO: Resolve references</p>
    case 'db_insert':
      return <p>TODO: Insert to database</p>
  }
}

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Import assets"
        description="Upload a CSV file to register a batch of assets"
      />

      <CurrentWizardStep />
    </>
  )
}
