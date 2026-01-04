'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { getUser } from '@/lib/auth'

export async function createPatient(formData: FormData) {
  'use server'

  let data: any = null

  try {
    const user = await getUser()
    const supabase = await createClient()

    // Check if clinician profile exists, create if not
    const { data: existingClinician } = await supabase
      .from('clinicians')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingClinician) {
      console.log('Creating clinician profile for user')
      const { error: clinicianError } = await supabase
        .from('clinicians')
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
          specialty: user.user_metadata?.specialty || null,
          role: 'clinician'
        })

      if (clinicianError) {
        console.error('Failed to create clinician profile:', clinicianError)
        throw new Error('Failed to create clinician profile')
      }
    }

    const patientData = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      date_of_birth: formData.get('date_of_birth') as string,
      gender: formData.get('gender') as string,
      national_id: formData.get('national_id') as string || null,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      address: formData.get('address') as string || null,
      city: formData.get('city') as string || null,
      parish: formData.get('parish') as string || null,
      postal_code: formData.get('postal_code') as string || null,
      country: formData.get('country') as string || 'Jamaica',
      emergency_contact_name: formData.get('emergency_contact_name') as string || null,
      emergency_contact_phone: formData.get('emergency_contact_phone') as string || null,
      emergency_contact_relationship: formData.get('emergency_contact_relationship') as string || null,
      blood_type: formData.get('blood_type') as string || null,
      occupation: formData.get('occupation') as string || null,
      marital_status: formData.get('marital_status') as string || null,
      smoking_status: formData.get('smoking_status') as string || null,
      alcohol_use: formData.get('alcohol_use') as string || null,
      clinician_id: user.id,
      created_by: user.id,
      updated_by: user.id,
    }

    console.log('Creating patient with data:', patientData)

    const result = await supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single()

    if (result.error) {
      console.error('Error creating patient:', result.error)
      throw new Error(`Failed to create patient: ${result.error.message}`)
    }

    if (!result.data) {
      console.error('Patient created but no data returned - possible RLS issue')
      throw new Error('Patient created but cannot access the data')
    }

    data = result.data
    revalidatePath('/patients')
  } catch (error) {
    console.error('Error in createPatient:', error)
    throw error
  }

  // Redirect after successful creation (outside try-catch to avoid catching NEXT_REDIRECT)
  redirect(`/patients/${data.id}`)
}

export async function updatePatient(id: string, formData: FormData) {
  try {
    const user = await getUser()
    const supabase = await createClient()

    // Check if user can access this patient for writing
    const { data: canAccess, error: accessError } = await supabase.rpc('can_access_patient', {
      p_patient_id: id
    })

    if (accessError || !canAccess) {
      console.error('Access denied for patient update:', { patientId: id, userId: user.id })
      throw new Error('You do not have permission to update this patient')
    }

    // Also check for write permission specifically (not just read access)
    const { data: patientCheck, error: patientError } = await supabase
      .from('patients')
      .select('clinician_id')
      .eq('id', id)
      .single()

    if (patientError) {
      console.error('Error checking patient ownership:', patientError)
      throw new Error('Patient not found')
    }

    // Check if user owns the patient or has write/full share permission
    const ownsPatient = patientCheck.clinician_id === user.id
    let hasWritePermission = ownsPatient

    if (!hasWritePermission) {
      // Check for write/full permission via shares
      const { data: shares, error: shareError } = await supabase
        .from('patient_shares')
        .select('permission_level, shared_by, expires_at')
        .eq('patient_id', id)
        .eq('shared_with', user.id)

      console.log('Patient shares check:', { shares, shareError })

      if (!shareError && shares && shares.length > 0) {
        const validShares = shares.filter(share =>
          (share.expires_at === null || new Date(share.expires_at) > new Date()) &&
          (share.permission_level === 'write' || share.permission_level === 'full')
        )
        hasWritePermission = validShares.length > 0
        console.log('Valid write shares found:', validShares.length)
      }
    }

    console.log('Final permission result:', { ownsPatient, hasWritePermission })

    if (!hasWritePermission) {
      throw new Error('You do not have write permission for this patient')
    }

    // Double-check that the patient exists and get full data for debugging
    const { data: patientForDebug, error: debugError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (debugError || !patientForDebug) {
      console.error('Patient not found for update:', { patientId: id, error: debugError })
      throw new Error('Patient not found')
    }

    console.log('Patient ownership check:', {
      patientId: id,
      patientClinicianId: patientForDebug.clinician_id,
      currentUserId: user.id,
      userOwnsPatient: patientForDebug.clinician_id === user.id
    })

    const patientData = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      date_of_birth: formData.get('date_of_birth') as string,
      gender: formData.get('gender') as string,
      national_id: formData.get('national_id') as string || null,
      email: formData.get('email') as string || null,
      phone: formData.get('phone') as string || null,
      address: formData.get('address') as string || null,
      city: formData.get('city') as string || null,
      parish: formData.get('parish') as string || null,
      postal_code: formData.get('postal_code') as string || null,
      country: formData.get('country') as string || 'Jamaica',
      emergency_contact_name: formData.get('emergency_contact_name') as string || null,
      emergency_contact_phone: formData.get('emergency_contact_phone') as string || null,
      emergency_contact_relationship: formData.get('emergency_contact_relationship') as string || null,
      blood_type: formData.get('blood_type') as string || null,
      occupation: formData.get('occupation') as string || null,
      marital_status: formData.get('marital_status') as string || null,
      smoking_status: formData.get('smoking_status') as string || null,
      alcohol_use: formData.get('alcohol_use') as string || null,
      updated_by: user.id,
    }

    console.log('Attempting to update patient:', { patientId: id, userId: user.id, hasWritePermission })
    console.log('Update data:', patientData)

    // First, check if patient exists and get current data
    const { data: existingPatient, error: checkError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingPatient) {
      console.error('Patient not found or cannot access:', { patientId: id, error: checkError })
      throw new Error('Patient not found')
    }

    console.log('Existing patient data:', patientForDebug)

    // Perform the update
    const { error: updateError } = await supabase
      .from('patients')
      .update(patientData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating patient:', updateError)
      console.error('Patient data attempted:', patientData)

      // Check if this is an RLS permission error
      if (updateError.code === 'PGRST116' || updateError.message.includes('permission')) {
        throw new Error('You do not have permission to update this patient')
      }

      throw new Error(`Failed to update patient: ${updateError.message}`)
    }

    console.log('Update query executed without error')

    // Check if the update actually changed anything
    const { data: updatedPatient, error: verifyError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (verifyError) {
      console.log('Cannot verify update (RLS):', verifyError)
    } else {
      console.log('Updated patient data:', updatedPatient)
      const hasChanges = JSON.stringify(existingPatient) !== JSON.stringify(updatedPatient)
      console.log('Data actually changed:', hasChanges)
    }

    // Try to fetch the updated patient data for return value
    const { data, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    // If we can't fetch it back, that's OK - the update succeeded
    if (fetchError) {
      console.log('Update successful but cannot read back due to RLS - returning success')
    }

    revalidatePath('/patients')
    revalidatePath(`/patients/${id}`)

    // Redirect after successful update
    redirect(`/patients/${id}`)
  } catch (error) {
    // Don't log NEXT_REDIRECT errors - they're expected for successful redirects
    if (!(error && typeof error === 'object' && 'digest' in error && typeof (error as any).digest === 'string' && (error as any).digest.includes('NEXT_REDIRECT'))) {
      console.error('Error in updatePatient:', error)
    }
    throw error
  }
}

// Jamaican surnames for realistic demo data
const JAMAICAN_SURNAMES = [
  'Williams', 'Brown', 'Smith', 'Campbell', 'Johnson', 'Thompson', 'Anderson', 'Robinson',
  'Jones', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Jackson', 'White', 'Harris',
  'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis',
  'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez',
  'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter', 'Mitchell',
  'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards',
  'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook', 'Morgan',
  'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper', 'Richardson', 'Cox', 'Howard',
  'Ward', 'Torres', 'Peterson', 'Gray', 'Ramirez', 'James', 'Watson', 'Brooks',
  'Kelly', 'Sanders', 'Price', 'Bennett', 'Wood', 'Barnes', 'Ross', 'Henderson',
  'Coleman', 'Jenkins', 'Perry', 'Powell', 'Long', 'Patterson', 'Hughes', 'Flores',
  'Washington', 'Butler', 'Simmons', 'Foster', 'Gonzales', 'Bryant', 'Alexander',
  'Russell', 'Griffin', 'Diaz', 'Hayes', 'Myers', 'Ford', 'Hamilton', 'Graham',
  'Sullivan', 'Wallace', 'Woods', 'Cole', 'West', 'Jordan', 'Owens', 'Reynolds',
  'Fisher', 'Ellis', 'Harrison', 'Gibson', 'McDonald', 'Cruz', 'Marshall', 'Ortiz',
  'Gomez', 'Murray', 'Freeman', 'Wells', 'Webb', 'Simpson', 'Stevens', 'Tucker',
  'Porter', 'Hunter', 'Hicks', 'Crawford', 'Henry', 'Boyd', 'Mason', 'Morales',
  'Kennedy', 'Warren', 'Dixon', 'Ramos', 'Reyes', 'Burns', 'Gordon', 'Shaw',
  'Holmes', 'Rice', 'Robertson', 'Hunt', 'Black', 'Daniels', 'Palmer', 'Mills',
  'Nichols', 'Grant', 'Knight', 'Ferguson', 'Rose', 'Stone', 'Hawkins', 'Dunn',
  'Perkins', 'Hudson', 'Spencer', 'Gardner', 'Stephens', 'Payne', 'Pierce', 'Berry',
  'Matthews', 'Arnold', 'Wagner', 'Willis', 'Ray', 'Watkins', 'Olson', 'Carroll',
  'Duncan', 'Snyder', 'Hart', 'Cunningham', 'Bradley', 'Lane', 'Andrews', 'Ruiz',
  'Harper', 'Fox', 'Riley', 'Armstrong', 'Carpenter', 'Weaver', 'Greene', 'Lawrence',
  'Elliott', 'Chavez', 'Sims', 'Austin', 'Peters', 'Kelley', 'Franklin', 'Lawson',
  'Fields', 'Gutierrez', 'Ryan', 'Schmidt', 'Carr', 'Vasquez', 'Castillo', 'Wheeler',
  'Chapman', 'Oliver', 'Montgomery', 'Richards', 'Williamson', 'Johnston', 'Banks',
  'Meyer', 'Bishop', 'McCoy', 'Howell', 'Alvarez', 'Morrison', 'Hansen', 'Fernandez',
  'Garza', 'Harvey', 'Little', 'Burton', 'Stanley', 'Nguyen', 'George', 'Jacobs',
  'Reid', 'Kim', 'Fuller', 'Lynch', 'Dean', 'Gilbert', 'Garrett', 'Romero',
  'Welch', 'Larson', 'Frazier', 'Burke', 'Hanson', 'Day', 'Mendoza', 'Moreno',
  'Bowman', 'Medina', 'Fowler', 'Brewer', 'Hoffman', 'Carlson', 'Silva', 'Pearson',
  'Holland', 'Douglas', 'Fleming', 'Jensen', 'Vargas', 'Byrd', 'Davidson', 'Hopkins',
  'May', 'Terry', 'Herrera', 'Wade', 'Soto', 'Walters', 'Curtis', 'Neal',
  'Caldwell', 'Lowe', 'Jennings', 'Barnett', 'Graves', 'Jimenez', 'Horton', 'Shelton',
  'Barrett', 'Obrien', 'Castro', 'Sutton', 'Gregory', 'McKinney', 'Lucas', 'Miles',
  'Craig', 'Rodriquez', 'Chambers', 'Holt', 'Lambert', 'Fletcher', 'Watts', 'Bates',
  'Hale', 'Rhodes', 'Pena', 'Beck', 'Newman', 'Haynes', 'McDaniel', 'Mendez',
  'Bush', 'Vaughn', 'Parks', 'Dawson', 'Santiago', 'Norris', 'Hardy', 'Love',
  'Steele', 'Curry', 'Powers', 'Schultz', 'Barker', 'Guzman', 'Page', 'Munoz',
  'Ball', 'Keller', 'Chandler', 'Weber', 'Leonard', 'Walsh', 'Lyons', 'Ramsey',
  'Wolfe', 'Schneider', 'Mullins', 'Benson', 'Sharp', 'Bowen', 'Daniel', 'Barber',
  'Cummings', 'Hines', 'Baldwin', 'Griffith', 'Valdez', 'Hubbard', 'Salazar',
  'Reeves', 'Warner', 'Stevenson', 'Burgess', 'Santos', 'Tate', 'Cross', 'Garner',
  'Mann', 'Mack', 'Moss', 'Thornton', 'Dennis', 'McGee', 'Farmer', 'Delgado',
  'Aguilar', 'Vega', 'Glover', 'Manning', 'Cohen', 'Harmon', 'Rodgers', 'Robbins',
  'Newton', 'Todd', 'Blair', 'Higgins', 'Ingram', 'Reese', 'Cannon', 'Strickland',
  'Townsend', 'Potter', 'Goodwin', 'Walton', 'Rowe', 'Hampton', 'Ortega', 'Patton',
  'Swanson', 'Joseph', 'Francis', 'Goodman', 'Maldonado', 'Yates', 'Becker', 'Erickson',
  'Hodges', 'Rios', 'Conner', 'Adkins', 'Webster', 'Norman', 'Malone', 'Hammond',
  'Flowers', 'Cobb', 'Moody', 'Quinn', 'Blake', 'Maxwell', 'Pope', 'Floyd',
  'Osborne', 'Paul', 'McCarthy', 'Guerrero', 'Lindsey', 'Estrada', 'Sandoval', 'Gibbs',
  'Tyler', 'Gross', 'Fitzgerald', 'Stokes', 'Doyle', 'Sherman', 'Saunders', 'Wise',
  'Colon', 'Gill', 'Alvarado', 'Greer', 'Padilla', 'Simon', 'Waters', 'Nunez',
  'Ballard', 'Schwartz', 'McBride', 'Houston', 'Christensen', 'Klein', 'Pratt',
  'Briggs', 'Parsons', 'Mclaughlin', 'Zimmerman', 'French', 'Buchanan', 'Moran',
  'Copeland', 'Roy', 'Pittman', 'Brady', 'McCormick', 'Holloway', 'Brock', 'Poole',
  'Frank', 'Logan', 'Owen', 'Bass', 'Marsh', 'Drake', 'Wong', 'Jefferson',
  'Park', 'Morton', 'Abbott', 'Sparks', 'Patrick', 'Norton', 'Huff', 'Clayton',
  'Massey', 'Lloyd', 'Figueroa', 'Carson', 'Bowers', 'Roberson', 'Barton', 'Tran',
  'Lamb', ' Harrington', 'Casey', 'Boone', 'Cortez', 'Clarke', 'Mathis', 'Singleton',
  'Wilkins', 'Cain', 'Bryan', 'Underwood', 'Hogan', 'Mckenzie', 'Collier', 'Luna',
  'Phelps', 'McGuire', 'Allison', 'Bridges', 'Wilkerson', 'Nash', 'Summers', 'Atkins',
  'Wilcox', 'Pitts', 'Conley', 'Marquez', 'Burnett', 'Richard', 'Cochran', 'Chase',
  'Davenport', 'Hood', 'Gates', 'Clay', 'Ayala', 'Sawyer', 'Roman', 'Vazquez',
  'Dickerson', 'Hodge', 'Acosta', 'Flynn', 'Espinoza', 'Nicholson', 'Monroe', 'Wolf',
  'Morrow', 'Kirk', 'Randall', 'Anthony', 'Whitaker', 'Oconnor', 'Skinner', 'Ware',
  'Molina', 'Kirby', ' Huffman', 'Bradford', 'Charles', 'Gilmore', 'Dominguez', 'Oneal',
  'Bruce', 'Lang', 'Combs', 'Kramer', 'Heath', 'Hancock', 'Gallagher', 'Gaines',
  'Shaffer', 'Short', 'Wiggins', 'Mathews', 'McClain', 'Fischer', 'Wall', 'Small',
  'Melton', 'Hensley', 'Bond', ' Dyer', 'Cameron', 'Grimes', 'Contreras', 'Christian',
  'Wyatt', 'Baxter', 'Snow', 'Mosley', 'Shepherd', 'Larsen', 'Hoover', 'Beasley',
  'Glenn', 'Petersen', 'Whitehead', 'Meyers', 'Keith', 'Garrison', 'Vincent', 'Shields',
  'Horn', 'Savage', 'Olsen', 'Schroeder', 'Hartman', 'Woodard', 'Mueller', 'Kemp',
  'Deleon', 'Booth', 'Patel', 'Calhoun', 'Wiley', 'Eaton', 'Cline', 'Navarro',
  'Harrell', 'Lester', 'Humphrey', 'Parrish', 'Duran', 'Hutchinson', 'Hess', 'Dorsey',
  'Bullock', 'Robles', 'Beard', 'Dalton', 'Avila', 'Vance', 'Rich', 'Blackwell',
  'York', 'Johns', 'Blankenship', 'Trevino', 'Salinas', 'Campos', 'Ponce', 'English',
  'Sweeney', 'Strong', 'Prince', 'McLean', 'Conway', 'Walter', 'Roth', 'Maynard',
  'Farrell', 'Lowery', 'Hurst', 'Nixon', 'Weiss', 'Trujillo', 'Ellison', 'Sloan',
  'Juarez', 'Winters', 'McMillan', 'Cleveland', 'Clements', 'Henson', 'Fulton', 'Snider',
  'Blank', 'Atkinson', 'Beckham', 'McCann', 'Buck', 'Villarreal', 'Christian-McDonald',
  'Zamora', 'Mayer', 'Rothwell', 'Gould', 'Strong-Thompson', 'Hayward', 'Blackwood',
  'Winter', 'Silvera', 'Gooden', 'Beckford', 'Hibbert', 'Linton', 'Banton', 'McFarlane',
  'Ferguson-Brown', 'Dixon-Hall', 'Wilson-Reid', 'Campbell-Graham', 'Thompson-Davis'
];

const PARISHES = [
  'Kingston', 'St. Andrew', 'St. Catherine', 'Clarendon', 'Manchester', 'St. Elizabeth',
  'Westmoreland', 'Hanover', 'St. James', 'Trelawny', 'St. Ann', 'St. Mary', 'Portland', 'St. Thomas'
];

const GENDERS = ['male', 'female'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDOB(): string {
  const start = new Date(1950, 0, 1);
  const end = new Date(2005, 11, 31);
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return randomDate.toISOString().split('T')[0];
}

function generatePhone(): string | null {
  if (Math.random() < 0.3) return null; // 30% chance of no phone
  const prefixes = ['876', '658', '876'];
  const prefix = getRandomElement(prefixes);
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `${prefix}-${number.toString().slice(0, 3)}-${number.toString().slice(3)}`;
}

function generateEmail(firstName: string, lastName: string): string | null {
  if (Math.random() < 0.2) return null; // 20% chance of no email
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
  return `${firstName.toLowerCase()}.${cleanLastName}@${getRandomElement(domains)}`;
}

function generateAddress(): string | null {
  if (Math.random() < 0.4) return null; // 40% chance of no address
  const streets = ['Main Street', 'Church Street', 'King Street', 'Queen Street', 'High Street'];
  const numbers = Math.floor(Math.random() * 999) + 1;
  return `${numbers} ${getRandomElement(streets)}`;
}

function generateNationalId(): string | null {
  if (Math.random() < 0.5) return null; // 50% chance of no national ID
  return Math.floor(Math.random() * 900000000) + 100000000 + 'A';
}

export async function generateDemoPatients() {
  'use server'

  try {
    const user = await getUser()
    const supabase = await createClient()

    console.log('Generating 50 demo patients for user:', user.id)

    const patients = []

    for (let i = 0; i < 50; i++) {
      const lastName = getRandomElement(JAMAICAN_SURNAMES)

      const patientData = {
        first_name: 'demo-patient',
        last_name: lastName,
        date_of_birth: getRandomDOB(),
        gender: Math.random() < 0.7 ? getRandomElement(GENDERS) : null, // 30% chance of no gender
        national_id: generateNationalId(),
        email: generateEmail('demo-patient', lastName),
        phone: generatePhone(),
        address: generateAddress(),
        city: Math.random() < 0.6 ? 'Kingston' : null, // 40% chance of no city
        parish: Math.random() < 0.7 ? getRandomElement(PARISHES) : null, // 30% chance of no parish
        postal_code: Math.random() < 0.8 ? null : 'JM00000', // 20% chance of postal code
        country: 'Jamaica',
        emergency_contact_name: Math.random() < 0.6 ? null : `Emergency Contact ${i + 1}`, // 40% chance of emergency contact
        emergency_contact_phone: Math.random() < 0.7 ? null : generatePhone(), // 30% chance of emergency phone
        emergency_contact_relationship: Math.random() < 0.8 ? null : 'Family Member', // 20% chance of relationship
        blood_type: Math.random() < 0.5 ? null : getRandomElement(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']), // 50% chance of blood type
        occupation: Math.random() < 0.6 ? null : getRandomElement(['Teacher', 'Nurse', 'Farmer', 'Driver', 'Clerk']), // 40% chance of occupation
        marital_status: Math.random() < 0.7 ? null : getRandomElement(['single', 'married', 'divorced', 'widowed']), // 30% chance of marital status
        smoking_status: Math.random() < 0.8 ? null : getRandomElement(['never', 'former', 'current']), // 20% chance of smoking status
        alcohol_use: Math.random() < 0.9 ? null : getRandomElement(['none', 'occasional', 'moderate']), // 10% chance of alcohol use
        clinician_id: user.id,
        created_by: user.id,
        updated_by: user.id,
      }

      patients.push(patientData)
    }

    console.log('Generated patient data, inserting into database...')

    // Insert patients in batches to avoid hitting limits
    const batchSize = 10
    let insertedCount = 0

    for (let i = 0; i < patients.length; i += batchSize) {
      const batch = patients.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('patients')
        .insert(batch)
        .select()

      if (error) {
        console.error('Error inserting batch:', error)
        throw new Error(`Failed to insert batch ${i / batchSize + 1}: ${error.message}`)
      }

      insertedCount += data?.length || 0
      console.log(`Inserted batch ${i / batchSize + 1}, total inserted: ${insertedCount}`)
    }

    revalidatePath('/patients')

    return {
      success: true,
      message: `Successfully generated and inserted ${insertedCount} demo patients`,
      patients: insertedCount
    }

  } catch (error) {
    console.error('Error generating demo patients:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      patients: 0
    }
  }
}

export async function deletePatient(id: string) {
  try {
    const user = await getUser()
    const supabase = await createClient()

    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting patient:', error)
      throw new Error('Failed to delete patient')
    }

    revalidatePath('/patients')
  } catch (error) {
    console.error('Error in deletePatient:', error)
    throw error
  }

  // Redirect after successful deletion (outside try-catch to avoid catching NEXT_REDIRECT)
  redirect('/patients')
}
