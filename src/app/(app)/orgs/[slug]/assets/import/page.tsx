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
import { useCategories, useCategoryMutations } from '@/lib/hooks/useCategories'
import { useDepartmentMutations, useDepartments } from '@/lib/hooks/useDepartments'
import { useLocationMutations, useLocations } from '@/lib/hooks/useLocations'
import { useVendorMutations, useVendors } from '@/lib/hooks/useVendors'
import {
  AssetFormInput,
  IMPORTED_ASSET_LABELS,
  ImportedAsset,
  ImportedAssetSchema,
} from '@/lib/types'

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
  const { data: categories } = useCategories()
  const { create: createCategory } = useCategoryMutations()
  const { data: departments } = useDepartments()
  const { create: createDepartment } = useDepartmentMutations()
  const { data: location } = useLocations()
  const { create: createLocation } = useLocationMutations()
  const { data: vendors } = useVendors()
  const { create: createVendor } = useVendorMutations()
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

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

    validatedAssets.forEach(async (asset) => {
      const resolvedAsset: AssetFormInput = {
        name: asset.name,
        assetTag: asset.assetTag,
        isBulk: false,
        quantity: asset.quantity ? Number(asset.quantity) : null,
        categoryId: null,
        departmentId: null,
        locationId: null,
        status: 'active', // default is 'active'
        purchaseDate: asset.purchaseDate,
        purchaseCost: asset.purchaseCost ? Number(asset.purchaseCost) : null,
        warrantyExpiry: asset.warrantyExpiry,
        vendorId: null,
      }

      if (asset.isBulk) {
        if (asset.isBulk.toLowerCase() === 'true' || asset.isBulk.toLowerCase() === 'yes') {
          resolvedAsset.isBulk = true
        } else if (asset.isBulk.toLowerCase() === 'false' || asset.isBulk.toLowerCase() === 'no') {
          resolvedAsset.isBulk = false
        }
      }
      if (asset.status) {
        const assetStatus = asset.status.toLowerCase().trim().replaceAll(' ', '_')
        switch (assetStatus) {
          case 'active':
            resolvedAsset.status = 'active'
            break

          case 'under_maintenance':
            resolvedAsset.status = 'under_maintenance'
            break

          case 'retired':
            resolvedAsset.status = 'retired'
            break

          case 'lost':
            resolvedAsset.status = 'lost'
            break

          case 'in_storage':
            resolvedAsset.status = 'in_storage'
            break

          case 'checked_out':
            resolvedAsset.status = 'checked_out'
            break

          case 'reserved':
            resolvedAsset.status = 'reserved'
            break

          default:
            break
        }
      }
      if (asset.category) {
        // we have a category, find the id and set the resolvedAsset.category
        const result = categories.find((category) => category.name === asset.category)
        if (result) {
          resolvedAsset.categoryId = result.id
        } else {
          // no match, create the category
          const id = await createCategory({ name: asset.category })
          if (id) {
            resolvedAsset.categoryId = id
          }
        }
      } else {
        // no category provided, skip
      }

      if (asset.department) {
        // We have a department, find the id and set the resolvedAsset.department
        const result = departments.find((department) => department.name === asset.department)
        if (result) {
          resolvedAsset.departmentId = result.id
        } else {
          // no match, create the department
          const id = await createDepartment({ name: asset.department })
          if (id) {
            resolvedAsset.departmentId = id
          }
        }
      } else {
        // no department provided, skip
      }
      if (asset.location) {
        const result = location.find((locaiton) => locaiton.name === asset.location)
        if (result) {
          resolvedAsset.locationId = result.id
        } else {
          const id = await createLocation({ name: asset.location })
          if (id) {
            resolvedAsset.locationId = id
          }
        }
      }
      if (asset.vendor) {
        const result = vendors.find((vendor) => vendor.name === asset.vendor)
        if (result) {
          resolvedAsset.vendorId = result.id
        } else {
          const id = await createVendor({ name: asset.vendor })
          if (id) {
            resolvedAsset.vendorId = id
          }
        }
      }
    })
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
          <PageHeader
            title="Import assets"
            description="Upload a CSV file to register a batch of assets. "
          />
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
        <>
          <PageHeader title="Column Mapping" description="Select columns from uploaded file. " />
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
                            if (v !== '__none__') {
                              setSelectedColumns(
                                selectedColumns.filter(
                                  (status) => status !== field.value?.split(':')[0]
                                )
                              )
                              setSelectedColumns((prev) => [...prev, v.split(':')[0] ?? ''])
                            } else {
                              setSelectedColumns(
                                selectedColumns.filter(
                                  (status) => status !== field.value?.split(':')[0]
                                )
                              )
                            }
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
                              <SelectItem
                                key={i}
                                value={`${column}:${i}`}
                                disabled={selectedColumns.includes(column)}
                              >
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
              <div className="flex gap-4 pt-2">
                <Button
                  variant={'secondary'}
                  onClick={() => {
                    setWizardStep('file_select')
                  }}
                >
                  Cancel
                </Button>
                <Button variant={'default'} onClick={handleBacktoColumnMapping}>
                  Confirm
                </Button>
              </div>
            </form>
          </Form>
        </>
      )

    case 'schema_validate':
      return (
        <>
          <PageHeader
            title="Schema Validation"
            description="Each row in this uploaded file is checked against our schema. "
          />
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
  return <CurrentWizardStep />
}
