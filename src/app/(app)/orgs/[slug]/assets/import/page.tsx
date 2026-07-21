'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Papa, { ParseResult } from 'papaparse'
import { ChangeEvent, useState } from 'react'
import { useForm } from 'react-hook-form'

import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IMPORTED_ASSET_LABELS, ImportedAsset, ImportedAssetSchema } from '@/lib/types'

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
  const [uploadedData, setUploadedData] = useState<string[][]>([])

  const mappingForm = useForm<ImportedAsset>({
    resolver: zodResolver(ImportedAssetSchema),
  })

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      setSelectedFile(selectedFiles.item(0))
    }
  }
  const handleFileUpload = () => {
    if (selectedFile) {
      Papa.parse(selectedFile, {
        complete: function ({ data, errors }: ParseResult<string[]>) {
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

  const handleMappingSubmit = () => {
    console.log(mappingForm.getValues())
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
      return (
        <Form {...mappingForm}>
          <form onSubmit={mappingForm.handleSubmit(handleMappingSubmit)} className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2">
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
                            <SelectItem key={i} value={`${column}:${i}`}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
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
