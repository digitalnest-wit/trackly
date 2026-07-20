'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Papa, { ParseResult } from 'papaparse'
import { ChangeEvent, useState } from 'react'
import { useForm } from 'react-hook-form'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IMPORTED_ASSET_LABELS, ImportedAsset, ImportedAssetSchema } from '@/lib/types'

// the steps for the import process
type WizardStep =
  | 'file_select'
  | 'column_mapping'
  | 'schema_validate'
  | 'resolving_refs'
  | 'db_insert'

function CurrentWizardStep() {
  // router enables us to interface with browser navigation (go back, refresh,
  // go to page, etc.)
  const router = useRouter()

  // the file selected by the user
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  // the current step of the wizard
  const [wizardStep, setWizardStep] = useState<WizardStep>('file_select')
  // the data parsed from the uploaded file
  const [uploadedData, setUploadedData] = useState<string[][]>([])
  // the form, mapping properties in ImportedAsset to actual columns
  // in uploaded data CSV header.
  const mappingForm = useForm<ImportedAsset>({
    resolver: zodResolver(ImportedAssetSchema),
  })

  // handles when the file selection changes
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      setSelectedFile(selectedFiles.item(0))
    }
  }

  // handles when a file is uploaded
  const handleFileUpload = () => {
    if (selectedFile) {
      Papa.parse(selectedFile, {
        complete: ({ data, errors }: ParseResult<string[]>) => {
          setUploadedData(data)
          if (errors.length > 0) {
            console.log(errors)
          }
          console.log(data)
        },
      })
      setWizardStep('column_mapping')
    }
  }

  const handleMappingSubmit = (data: ImportedAsset) => {
    console.log(data)
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
                Selected file <strong>{selectedFile.name}</strong>
              </span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Input type="file" accept="text/csv" onChange={handleFileChange} />
            <Button disabled={selectedFile === null} onClick={handleFileUpload}>
              Next
            </Button>
          </div>
        </>
      )
    case 'column_mapping':
      return (
        <Form {...mappingForm}>
          <form onSubmit={mappingForm.handleSubmit(handleMappingSubmit)} className="space-y-8">
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(IMPORTED_ASSET_LABELS).map(([property, label]) => (
                <FormField
                  control={mappingForm.control}
                  key={`field-${property}`}
                  name={property as keyof ImportedAsset}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label}</FormLabel>
                      <Select
                        value={field.value ?? '__none__'}
                        onValueChange={(v) => {
                          field.onChange(v === '__none__' ? null : v)
                          console.log(`field '${property}' changed to '${v}'`)
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {uploadedData[0]?.map((column, i) => (
                            <SelectItem key={`select-item-${property}-${i}`} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <Button type="submit">Confirm</Button>
          </form>
        </Form>
      )
    case 'schema_validate':
      return <p>TODO validating against schema</p>
    case 'resolving_refs':
      return <p>TODO resolving reference data</p>
    case 'db_insert':
      return <p>TODO insert into db</p>
  }
}

export default function ImportPage() {
  return (
    <>
      <PageHeader title="Import Assets" description="Upload a CSV file to import assets." />
      <CurrentWizardStep />
    </>
  )
}
