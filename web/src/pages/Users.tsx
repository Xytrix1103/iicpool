import { Role } from '../components/firebase/schema.ts'
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
	ArmchairIcon,
	CarFrontIcon,
	CheckIcon,
	ChevronFirstIcon,
	ChevronLastIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	MailIcon,
	PencilIcon,
	PlusIcon,
} from 'lucide-react'
import SectionHeader from '../components/themed/components/SectionHeader.tsx'
import { FcGoogle } from 'react-icons/fc'
import { CaretDownIcon, CaretSortIcon, CaretUpIcon } from '@radix-ui/react-icons'
import { addUser, AddUserData, updateUser, UpdateUserData, UserTableRow } from '../api/users.ts'
import { useLoaderData } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/themed/ui-kit/dialog.tsx'
import { Controller, useForm } from 'react-hook-form'
import { Label } from '../components/themed/ui-kit/label.tsx'
import { Input } from '../components/themed/ui-kit/input.tsx'

type FormData = {
	full_name: string
	mobile_number: string
	email: string
}

type EmailFormData = {
	email: string
}

type PasswordFormData = {
	password: string
}

const Users = () => {
	const users: UserTableRow[] = useLoaderData() as UserTableRow[]
	const [sorting, setSorting] = useState<SortingState>([])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		'id': false,
	})
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	})
	const [selectedUserDialog, setSelectedUserDialog] = useState<string | null>(null)
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

	const onSubmit = (data: AddUserData | UpdateUserData) => {
		console.log(data)

		if (selectedUserDialog) {
			if (selectedUserDialog === '') {
				addUser(data as AddUserData).then(r => {
					console.log('add user', r)
				})
			} else {
				updateUser(selectedUserDialog, data as UpdateUserData).then(r => {
					console.log('update user', r)
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

	const tableColumns: ColumnDef<UserTableRow>[] = [
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
			header: 'Sign-in Methods',
			accessorKey: 'provider_data',
			cell: ({ row }) => {
				return <div className="py-1 space-y-2">
					{(row.getValue('provider_data') as ('google.com' | 'password')[]).map(provider => (
						<div key={provider} className="flex flex-row items-center space-x-3 w-auto">
							{
								provider === 'google.com' ?
									<FcGoogle size={24} /> :
									<MailIcon size={24} />
							}
							<span>{provider === 'google.com' ? 'Google' : 'Email'}</span>
						</div>
					))}
				</div>
			},
		},
		{
			header: 'Roles',
			accessorKey: 'roles',
			cell: ({ row }) => {
				return <div className="py-1 space-y-2">
					{(row.getValue('roles') as Role[]).map(role => (
						<div key={role} className="flex flex-row items-center space-x-3 w-auto">
							{
								role === Role.DRIVER ? <CarFrontIcon size={24} /> :
									<ArmchairIcon size={24} />
							}
							<span>{role === Role.DRIVER ? 'Driver' : 'Passenger'}</span>
						</div>
					))}
				</div>
			},
		},
		{
			header: 'Actions',
			cell: ({ row }) => {
				return (
					<div className="flex justify-center">
						<Button
							variant="ghost"
							onClick={() => setSelectedUserDialog(row.getValue('id'))}
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
		data: users,
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
		if (selectedUserDialog) {
			setValue('full_name', users.find(user => user.id === selectedUserDialog)?.full_name || '')
			setValue('mobile_number', users.find(user => user.id === selectedUserDialog)?.mobile_number || '')
			setValue('email', users.find(user => user.id === selectedUserDialog)?.email || '')
			setEmailValue('email', users.find(user => user.id === selectedUserDialog)?.email || '')
		} else {
			reset()
			resetEmail()
			resetPassword()
		}
	}, [reset, resetEmail, resetPassword, selectedUserDialog, setEmailValue, setValue, users])

	return (
		<section className="w-full h-full flex flex-col gap-[1rem]">
			<SectionHeader
				text="Users Management"
				extra={
					<div className="flex items-center gap-3">
						<Dialog
							open={selectedUserDialog !== null}
							onOpenChange={(isOpen) => {
								if (!isOpen) setSelectedUserDialog(null)
							}}
						>
							<DialogTrigger asChild>
								<Button variant="outline" className="px-3.5 py-1" onClick={() => {
									setSelectedUserDialog('')
								}}>
									<div className="flex gap-1.5 items-center">
										<PlusIcon size={16} />
										<span>Add User</span>
									</div>
								</Button>
							</DialogTrigger>
							<DialogContent
								className="border border-input !rounded-3xl !min-w-[70vw] !max-w-screen max-h-screen overflow-y-auto gap-8"
								aria-describedby={undefined}
							>
								<DialogHeader>
									<DialogTitle>
										Edit User
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
															disabled={true}
														/>
													</>
												)}
											/>
										</div>
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
														<div className="grid w-full max-w-sm items-center gap-1.5">
															<Controller
																name="email"
																control={emailControl}
																rules={{
																	required: 'Email is required',
																	pattern: {
																		value: /newinti.edu.my$/,
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
														<div className="grid w-full max-w-sm items-center gap-1.5">
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
											onClick={() => setSelectedUserDialog(null)}
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

export default Users
