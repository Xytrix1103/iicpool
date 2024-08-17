type User = {
	roles: Role[];
	full_name: string;
}

enum Role {
	DRIVER = 'driver',
	PASSENGER = 'passenger',
}

export {
	User,
	Role,
}
