try {
    const sha2 = require('../../src/hashes/sha2-256.js')

    // arbitrary test case 1
    if (sha2('test') !== '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08') {
        throw Error(
            'sha2 (256 bit) hashing implementation failure\n'+
            'sha2("test") !== "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"\n'
        )
    }

    // arbitrary test case 2
    if (sha2('password') !== '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8') {
        throw Error(
            'sha2 (256 bit) hashing implementation failure\n'+
            'sha2("password") !== "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"\n'
        )
    }

    // arbitrary test case 3
    if (sha2('0') !== '5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9') {
        throw Error(
            'sha2 (256 bit) hashing implementation failure\n'+
            'sha2(0) !== "5feceb66ffc86f38d952786c6d696c79c2dbc239dd4e91b46729d73a27fb57e9"\n'
        )
    }

    // testing that 0 causes an error
    errorThrown = null
    try { sha2(0) } catch (error) { errorThrown = error }

    if (!errorThrown) {
        throw Error(
            'sha2 (256 bit) behavioral implementation failure \n'+
            'sha2(undefined) did not throw error"\n'
        )
    }

    // testing that 0 causes an error
    errorThrown = null
    try { sha2(123) } catch (error) { errorThrown = error }

    if (!errorThrown) {
        throw Error(
            'sha2 (256 bit) behavioral implementation failure \n'+
            'sha2(123) did not throw error"\n'
        )
    }

    // testing that undefined causes an error
    errorThrown = null
    try { sha2(undefined) } catch (error) { errorThrown = error }

    if (!errorThrown) {
        throw Error(
            'sha2 (256 bit) behavioral implementation failure \n'+
            'sha2(undefined) did not throw error"\n'
        )
    }

    // testing that null causes an error
    errorThrown = null
    try { sha2(null) } catch (error) { errorThrown = error }

    if (!errorThrown) {
        throw Error(
            'sha2 (256 bit) behavioral implementation failure \n'+
            'sha2(null) did not throw error"\n'
        )
    }

    console.log('✅ sha2 (256 bit) tests passed')

}
catch (error) {
    console.log('⚠️ failed to test sha2 (256 bit)', error)
} 