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
  const [validAssetCounter, setValidAssetCounter] = useState<number>(0)
  const [invalidAssetCounter, setInvalidAssetCounter] = useState<number>(0)
  const [validatedAssets, setValidatedAssets] = useState<ImportedAsset[]>([])
  const mappingForm = useForm<ImportedAsset>({
    resolver: zodResolver(ImportedAssetSchema),
    // Added default values to allow to fix safe parse undefined error and to allow the form to be submitted with optional parameters
    defaultValues: {
      isBulk: null,
      quantity: null,
      category: null,
      department: null,
      location: null,
      status: null,
      purchaseDate: null,
      purchaseCost: null,
      warrantyExpiry: null,
      vendor: null,
      notes: null,
    },
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

  const handleSchemaValidation = () => {
    setWizardStep('schema_validate')

    for (let assetRow = 1; assetRow < uploadedData.length - 1; assetRow++) {
      // Creates an ImportedAsset object setting all properties to undefined
      const asset: Partial<ImportedAsset> = {}
      // Efficiency Issues: We are doing String manipulation and conversion each time we add an item. Best practice would be to do it once
      Object.entries(mappingForm.getValues()).map(([property, columnLocation]) => {
        if (columnLocation != null) {
          asset[property as keyof ImportedAsset] =
            uploadedData[assetRow]![Number(columnLocation!.split(':')[1])]
        } else {
          ;(asset as Record<string, unknown>)[property] = null
        }
      })
      // Print the asset object with properties initialized to the given asset data from uploaded csv file
      console.log(asset)

      // Verify the object does follow the expected schema structure
      const result = ImportedAssetSchema.safeParse(asset)
      if (result.success) {
        // Store the valid asset rows
        setValidatedAssets((prev) => [...prev, result.data])
        // Add 1 to the valid asset row counter
        setValidAssetCounter((prevValidCOunt) => prevValidCOunt + 1)
      } else {
        // Add 1 to the invalid asset row counter
        setInvalidAssetCounter((prevInvalidCount) => prevInvalidCount + 1)
        console.log(result.error)
      }
    }
    console.log(validatedAssets)
  }

  const handleReferenceResolver = () => {
    setWizardStep('resolving_refs')
  }

  const handleBacktoColumnMapping = () => {
    setWizardStep('column_mapping')
    setValidAssetCounter(0)
    setInvalidAssetCounter(0)
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
          <form onSubmit={mappingForm.handleSubmit(handleSchemaValidation)} className="space-y-8">
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
      return (
        <>
          <div className="flex flex-col gap-2 p-2 pl-0">
            <p className="text-green-600">Successfully Validated Rows: {validAssetCounter}</p>
            <p className="text-destructive">Failed Validated Rows: {invalidAssetCounter}</p>
          </div>
          <div className="flex gap-4 pt-2">
            <Button variant={'secondary'} onClick={handleBacktoColumnMapping}>
              Cancel
            </Button>
            <Button variant={'default'} onClick={handleReferenceResolver}>
              Next
            </Button>
          </div>
        </>
      )
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
