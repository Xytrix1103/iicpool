import {
	ColumnDef,
	ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	SortingState,
	useReactTable,
	VisibilityState,
} from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/themed/ui-kit/table.tsx'
import { Button } from '../components/themed/ui-kit/button.tsx'

import {
	CheckIcon,
	ChevronFirstIcon,
	ChevronLastIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	PencilIcon,
	PlusIcon,
} from 'lucide-react'
import SectionHeader from '../components/themed/components/SectionHeader.tsx'
import { CaretDownIcon, CaretSortIcon, CaretUpIcon } from '@radix-ui/react-icons'
import { addAdmin, AddAdminData, AdminTableRow, refreshAdmins, updateAdmin, UpdateAdminData } from '../api/admins.ts'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/themed/ui-kit/dialog.tsx'
import { Controller, useForm } from 'react-hook-form'
import { Label } from '../components/themed/ui-kit/label.tsx'
import { Input } from '../components/themed/ui-kit/input.tsx'
import { useToast } from '../components/themed/ui-kit/use-toast.ts'
import { useLoaderData } from 'react-router-dom'
import { callToast } from '../api/toast-utils.ts'

type FormData = {
	full_name: string
	mobile_number: string
	email: string
	password: string
}

type EmailFormData = {
	email: string
}

type PasswordFormData = {
	password: string
}

const Admins = () => {
	const initialAdmins = useLoaderData() as AdminTableRow[]
	const [admins, setAdmins] = useState<AdminTableRow[]>(initialAdmins)
	const [sorting, setSorting] = useState<SortingState>([])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		'id': false,
	})
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	})
	const { toast } = useToast()
	const [selectedAdminDialog, setSelectedAdminDialog] = useState<string | null>(null)
	const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
	const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
	const form = useForm<FormData>({
		defaultValues: {
			full_name: '',
			mobile_number: '',
			email: '',
		},
	})
	const emailForm = useForm<EmailFormData>({
		defaultValues: {
			email: '',
		},
	})
	
	const passwordForm = useForm<PasswordFormData>({
		defaultValues: {
			password: '',
		},
	})
	
	const { handleSubmit, formState: { errors }, setValue, control, reset } = form
	const {
		handleSubmit: handleEmailSubmit,
		formState: { errors: emailErrors },
		setValue: setEmailValue,
		control: emailControl,
		reset: resetEmail,
	} = emailForm
	const {
		handleSubmit: handlePasswordSubmit,
		formState: { errors: passwordErrors },
		control: passwordControl,
		reset: resetPassword,
	} = passwordForm
	
	const onSubmit = (data: AddAdminData | UpdateAdminData) => {
		console.log(data)
		
		if (selectedAdminDialog) {
			if (selectedAdminDialog === '') {
				addAdmin(data as AddAdminData)
					.then(r => {
						console.log('add admin', r)
						setSelectedAdminDialog(null)
						callToast(toast, 'Success', 'Admin added successfully')
					})
					.catch(err => {
						console.error(err)
						callToast(toast, 'Error: ' + err.name, err.response?.data?.detail || err.message)
					})
					.finally(async () => {
						await refreshAdmins(setAdmins)
					})
			} else {
				updateAdmin(selectedAdminDialog, data as UpdateAdminData)
					.then(r => {
						console.log('update admin', r)
						setSelectedAdminDialog(null)
						callToast(toast, 'Success', 'Admin updated successfully')
					})
					.catch(e => {
						console.error(e)
						callToast(toast, 'Error: ' + e.name, e.response?.data?.detail || e.message)
					})
					.finally(async () => {
						await refreshAdmins(setAdmins)
					})
			}
		}
	}
	
	const onSubmitEmail = (data: EmailFormData) => {
		console.log(data)
	}
	
	const onSubmitPassword = (data: PasswordFormData) => {
		console.log(data)
	}
	
	const tableColumns: ColumnDef<AdminTableRow>[] = [
		{
			header: 'ID',
			accessorKey: 'id',
		},
		{
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => {
						const isSorted = column.getIsSorted()
						if (isSorted === 'desc') {
							column.clearSorting()
						} else {
							column.toggleSorting(column.getIsSorted() === 'asc')
						}
					}}
				>
					Full Name
					{
						column.getIsSorted() === false ?
							<CaretSortIcon className="ml-2 h-4 w-4" /> :
							column.getIsSorted() === 'asc' ?
								<CaretUpIcon className="ml-2 h-4 w-4" /> :
								<CaretDownIcon className="ml-2 h-4 w-4" />
					}
				</Button>
			),
			accessorKey: 'full_name',
			cell: ({ row }) => {
				return <div className="py-1">{row.getValue('full_name')}</div>
			},
		},
		{
			header: ({ column }) => (
				<Button
					variant="ghost"
					onClick={() => {
						const isSorted = column.getIsSorted()
						if (isSorted === 'desc') {
							column.clearSorting()
						} else {
							column.toggleSorting(column.getIsSorted() === 'asc')
						}
					}}
				>
					Email
					{
						column.getIsSorted() === false ?
							<CaretSortIcon className="ml-2 h-4 w-4" /> :
							column.getIsSorted() === 'asc' ?
								<CaretUpIcon className="ml-2 h-4 w-4" /> :
								<CaretDownIcon className="ml-2 h-4 w-4" />
					}
				</Button>
			),
			accessorKey: 'email',
			cell: ({ row }) => {
				return <div className="py-1">{row.getValue('email')}</div>
			},
		},
		{
			header: 'Mobile Number',
			accessorKey: 'mobile_number',
			cell: ({ row }) => <div className="py-1">{row.getValue('mobile_number')}</div>,
		},
		{
			header: 'Actions',
			cell: ({ row }) => {
				return (
					<div className="flex justify-center">
						<Button
							variant="ghost"
							onClick={() => setSelectedAdminDialog(row.getValue('id'))}
						>
							<PencilIcon size={16} />
						</Button>
					</div>
				)
			},
		},
	]
	
	const tableInstance = useReactTable({
		columns: tableColumns,
		data: admins || [],
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onPaginationChange: setPagination,
		autoResetPageIndex: false,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			pagination,
		},
	})
	
	useEffect(() => {
		if (selectedAdminDialog) {
			setValue('full_name', admins?.find(admin => admin.id === selectedAdminDialog)?.full_name || '')
			setValue('mobile_number', admins?.find(admin => admin.id === selectedAdminDialog)?.mobile_number || '')
			setValue('email', admins?.find(admin => admin.id === selectedAdminDialog)?.email || '')
			setEmailValue('email', admins?.find(admin => admin.id === selectedAdminDialog)?.email || '')
		} else {
			reset()
			resetEmail()
			resetPassword()
		}
	}, [reset, resetEmail, resetPassword, selectedAdminDialog, setEmailValue, setValue, admins])
	
	return (
		<section className="w-full h-full flex flex-col gap-[1rem]">
			<SectionHeader
				text="Admins Management"
				extra={
					<div className="flex items-center gap-3">
						<Dialog
							open={selectedAdminDialog !== null}
							onOpenChange={(isOpen) => {
								if (!isOpen) setSelectedAdminDialog(null)
							}}
						>
							<DialogTrigger asChild>
								<Button variant="outline" className="px-3.5 py-1" onClick={() => {
									setSelectedAdminDialog('')
								}}>
									<div className="flex gap-1.5 items-center">
										<PlusIcon size={16} />
										<span>Add Admin</span>
									</div>
								</Button>
							</DialogTrigger>
							<DialogContent
								className="border border-input !rounded-3xl !min-w-[70vw] !max-w-screen max-h-screen overflow-y-auto gap-8"
								aria-describedby={undefined}
							>
								<DialogHeader>
									<DialogTitle>
										{selectedAdminDialog === '' ? 'Add Admin' : 'Edit Admin'}
									</DialogTitle>
								</DialogHeader>
								<div className="flex flex-col gap-10">
									<div className="flex flex-row gap-3">
										<div className="grid w-full max-w-sm items-center gap-1.5">
											<Controller
												name="email"
												control={control}
												render={({ field }) => (
													<>
														<Label htmlFor="email" className="px-1">Email</Label>
														<Input
															{...field}
															type="text"
															id="email"
															className="rounded-2xl"
															placeholder=""
															disabled={selectedAdminDialog !== ''}
														/>
													</>
												)}
											/>
										</div>
										{
											selectedAdminDialog === '' ?
												<div className="grid w-full max-w-sm items-center gap-1.5">
													<Controller
														name="password"
														control={control}
														rules={{
															required: 'Password is required',
															minLength: {
																value: 8,
																message: 'Password must be at least 8 characters',
															},
															pattern: {
																value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
																message: 'Password must contain both letters and numbers, and be at least 8 characters',
															},
														}}
														render={({ field }) => (
															<>
																<Label htmlFor="password"
																       className="px-1">Password</Label>
																<Input
																	{...field}
																	type="password"
																	id="password"
																	className="rounded-2xl"
																	placeholder=""
																/>
																{
																	errors.password && (
																		<p className="text-red-500 text-sm font-medium">
																			{errors.password.message}
																		</p>
																	)
																}
															</>
														)}
													/>
												</div> :
												
												<div className="h-full w-auto flex flex-row max-w-sm items-end gap-1.5">
													<Dialog
														open={isEmailDialogOpen}
														onOpenChange={(isOpen) => setIsEmailDialogOpen(isOpen)}
													>
														<DialogTrigger asChild>
															<Button
																variant="outline"
																onClick={() => setIsEmailDialogOpen(true)}
																className="px-3.5 py-1"
															>
																Change Email
															</Button>
														</DialogTrigger>
														<DialogContent
															className="border border-input !rounded-3xl !min-w-[70vw] !max-w-screen max-h-screen overflow-y-auto gap-8"
															aria-describedby={undefined}
														>
															<DialogHeader>
																<DialogTitle>
																	Change Email
																</DialogTitle>
															</DialogHeader>
															<div className="flex flex-col gap-10">
																<div
																	className="grid w-full max-w-sm items-center gap-1.5">
																	<Controller
																		name="email"
																		control={emailControl}
																		rules={{
																			required: 'Email is required',
																			pattern: {
																				value: /@newinti.edu.my$/,
																				message: 'INTI email is required',
																			},
																		}}
																		render={({ field }) => (
																			<>
																				<Label htmlFor="email"
																				       className="px-1">Email</Label>
																				<Input
																					{...field}
																					type="text"
																					id="email"
																					className="rounded-2xl"
																					placeholder=""
																				/>
																				{emailErrors.email && (
																					<p className="text-red-500 text-sm font-medium">
																						{emailErrors.email?.message}
																					</p>
																				)}
																			</>
																		)}
																	/>
																</div>
																<div className="flex justify-end gap-3">
																	<Button
																		variant="ghost"
																		onClick={() => setIsEmailDialogOpen(false)}
																		className="px-3.5 py-1 text-primary"
																	>
																		Cancel
																	</Button>
																	<Button
																		variant="outline"
																		onClick={handleEmailSubmit(onSubmitEmail)}
																		className="px-3.5 py-1"
																	>
																		<div className="flex gap-1.5 items-center">
																			<CheckIcon size={16} />
																			<span>Save</span>
																		</div>
																	</Button>
																</div>
															</div>
														</DialogContent>
													</Dialog>
													<Dialog
														open={isPasswordDialogOpen}
														onOpenChange={(isOpen) => setIsPasswordDialogOpen(isOpen)}
													>
														<DialogTrigger asChild>
															<Button
																variant="outline"
																onClick={() => setIsPasswordDialogOpen(true)}
																className="px-3.5 py-1"
															>
																Change Password
															</Button>
														</DialogTrigger>
														<DialogContent
															className="border border-input !rounded-3xl !min-w-[70vw] !max-w-screen max-h-screen overflow-y-auto gap-8"
															aria-describedby={undefined}
														>
															<DialogHeader>
																<DialogTitle>
																	Change Password
																</DialogTitle>
															</DialogHeader>
															<div className="flex flex-col gap-10">
																<div
																	className="grid w-full max-w-sm items-center gap-1.5">
																	<Controller
																		name="password"
																		control={passwordControl}
																		rules={{
																			required: 'Password is required',
																			minLength: {
																				value: 8,
																				message: 'Password must be at least 8 characters',
																			},
																			pattern: {
																				value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
																				message: 'Password must contain both letters and numbers, and be at least 8 characters',
																			},
																		}}
																		render={({ field }) => (
																			<>
																				<Label htmlFor="password"
																				       className="px-1">Password</Label>
																				<Input
																					{...field}
																					type="password"
																					id="password"
																					className="rounded-2xl"
																					placeholder=""
																				/>
																				{passwordErrors.password && (
																					<p className="text-red-500 text-sm font-medium">
																						{passwordErrors.password?.message}
																					</p>
																				)}
																			</>
																		)}
																	/>
																</div>
																<div className="flex justify-end gap-3">
																	<Button
																		variant="ghost"
																		onClick={() => setIsPasswordDialogOpen(false)}
																		className="px-3.5 py-1 text-primary"
																	>
																		Cancel
																	</Button>
																	<Button
																		variant="outline"
																		onClick={handlePasswordSubmit(onSubmitPassword)}
																		className="px-3.5 py-1"
																	>
																		<div className="flex gap-1.5 items-center">
																			<CheckIcon size={16} />
																			<span>Save</span>
																		</div>
																	</Button>
																</div>
															</div>
														</DialogContent>
													</Dialog>
												</div>
										}
									</div>
									<div className="flex gap-3">
										<div className="grid w-full max-w-sm items-center gap-1.5">
											<Controller
												name="full_name"
												control={control}
												render={({ field }) => (
													<>
														<Label htmlFor="full_name" className="px-1">Full Name</Label>
														<Input
															{...field}
															type="text"
															id="full_name"
															className="rounded-2xl"
															placeholder=""
														/>
														{
															errors.full_name && (
																<p className="text-red-500 text-sm font-medium">
																	{errors.full_name.message}
																</p>
															)
														}
													</>
												)}
											/>
										</div>
										<div className="grid w-full max-w-sm items-center gap-1.5">
											<Controller
												name="mobile_number"
												control={control}
												rules={{
													required: 'Mobile Number is required',
													pattern: {
														// phone number pattern but in string format
														value: /^01[0-9]{8,9}$/,
														message: 'Invalid Mobile Number',
													},
												}}
												render={({ field }) => (
													<>
														<Label htmlFor="mobile_number" className="px-1">
															Mobile Number
														</Label>
														<Input
															{...field}
															type="text"
															id="mobile_number"
															className="rounded-2xl"
															placeholder=""
														/>
														{
															errors.mobile_number && (
																<p className="text-red-500 text-sm font-medium">
																	{errors.mobile_number.message}
																</p>
															)
														}
													</>
												)}
											/>
										</div>
									</div>
									<div className="flex justify-end gap-3">
										<Button
											variant="ghost"
											onClick={() => setSelectedAdminDialog(null)}
											className="px-3.5 py-1 text-primary"
										>
											Cancel
										</Button>
										<Button
											variant="outline"
											onClick={handleSubmit(onSubmit)}
											className="px-3.5 py-1"
										>
											<div className="flex gap-1.5 items-center">
												<CheckIcon size={16} />
												<span>Save</span>
											</div>
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				}
			/>
			<div className="w-full flex flex-col">
				<div className="rounded-2xl border border-input">
					<Table className="w-full">
						<TableHeader key="header">
							<TableRow key="header-row">
								{
									tableInstance.getHeaderGroups()?.map((headerGroup) => (
										headerGroup.headers.map((column) => (
											<TableHead key={column.id}>
												{column.isPlaceholder
													? null
													: flexRender(
														column.column.columnDef.header,
														column.getContext(),
													)}
											</TableHead>
										))
									))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{tableInstance.getRowModel().rows.length ? (
								tableInstance.getRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={tableColumns.length}
									           className="p-2 text-center">
										No data
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				<div className="flex items-center justify-end space-x-2 py-4">
					<div className="space-x-2">
						<Button
							variant="outline"
							className="px-1.5 py-1.5"
							onClick={() => tableInstance.firstPage()}
							disabled={!tableInstance.getCanPreviousPage()}
						>
							<ChevronFirstIcon size={16} color="black" />
						</Button>
						<Button
							variant="outline"
							className="px-1.5 py-1.5"
							onClick={() => tableInstance.previousPage()}
							disabled={!tableInstance.getCanPreviousPage()}
						>
							<ChevronLeftIcon size={16} color="black" />
						</Button>
						<Button
							variant="outline"
							className="px-1.5 py-1.5"
							onClick={() => tableInstance.nextPage()}
							disabled={!tableInstance.getCanNextPage()}
						>
							<ChevronRightIcon size={16} color="black" />
						</Button>
						<Button
							variant="outline"
							className="px-1.5 py-1.5"
							onClick={() => tableInstance.lastPage()}
							disabled={!tableInstance.getCanNextPage()}
						>
							<ChevronLastIcon size={16} color="black" />
						</Button>
					</div>
				</div>
			</div>
		</section>
	)
}

export default Admins
